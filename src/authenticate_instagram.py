from instagrapi import Client
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
username = os.getenv("INSTAGRAM_USERNAME")
password = os.getenv("INSTAGRAM_PASSWORD")

if not username or not password:
    print("Error: Please set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in your .env file.")
    exit(1)

client = Client()
try:
    client.login(username, password)
    print("Login successful!")
    client.dump_settings(Path("instagrapi_settings.json"))
    print("Session saved to instagrapi_settings.json")
except Exception as e:
    print(f"Login failed: {e}")
    exit(1) 