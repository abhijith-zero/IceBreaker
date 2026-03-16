import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8001/ws/session"
    print(f"Connecting to {uri} ...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected.")
            
            # Send initial setup
            setup_msg = {"type": "setup", "scenario_id": "tech_mixer"}
            await websocket.send(json.dumps(setup_msg))
            print("Sent setup message.")
            
            # Receive info message
            info_msg = await websocket.recv()
            print(f"Received: {info_msg}")
            
            # Send a dummy text message
            content_msg = {
                "client_content": {
                    "turns": [
                        {
                            "parts": [
                                {"text": "Hello, I am a new software engineer here."}
                            ]
                        }
                    ]
                }
            }
            await websocket.send(json.dumps(content_msg))
            print("Sent dummy text content.")
            
            # Receive response from Gemini
            print("Waiting for response from Gemini...")
            for _ in range(5):  # wait for a few chunks
                try:
                    res = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    print(f"Received from Gemini: {res[:200]}...") # truncate for display
                except asyncio.TimeoutError:
                    print("Timeout waiting for response.")
                    break
                    
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
