from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis
import asyncio
import config
from database import supabase

router = APIRouter(tags=["WebSocket Logs"])

@router.websocket("/ws/logs/{project_id}")
async def websocket_logs(websocket: WebSocket, project_id: str, token: str = Query(...)):
    await websocket.accept()

    try:
        # Validate token using supabase auth
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            await websocket.send_text("Unauthorized")
            await websocket.close(code=1008)
            return
    except Exception as e:
        await websocket.send_text("Invalid token")
        await websocket.close(code=1008)
        return

    # Setup Redis Pub/Sub
    r = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    channel = f"logs:{project_id}"
    pubsub.subscribe(channel)

    async def listen_to_redis():
        # Bridge synchronous Redis with asyncio
        try:
            while True:
                # get_message is non-blocking when timeout is not set, or we can use executor
                # for simple asyncio bridge we can use executor
                message = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                )
                if message and message['type'] == 'message':
                    await websocket.send_text(message['data'])
                # Small sleep to yield control if timeout=0 or get_message returned None
                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            pass

    redis_task = asyncio.create_task(listen_to_redis())

    try:
        while True:
            # Keep connection open and handle client disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        redis_task.cancel()
        pubsub.unsubscribe(channel)
        pubsub.close()
        r.close()
