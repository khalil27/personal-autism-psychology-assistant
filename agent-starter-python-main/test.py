import requests

url = "http://127.0.0.1:5001/startWorker"
data = {"room_name": "test_room"}
resp = requests.post(url, json=data)
print(resp.status_code)
print(resp.json())
