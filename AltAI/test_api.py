#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API AltAI
"""

import requests
import json
import time

BASE_URL = "http://localhost:8070"

def test_register():
    """Тестирует регистрацию пользователя"""
    print("🧪 Тест регистрации...")
    
    data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=data)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Ошибка: {e}")
        return False

def test_login():
    """Тестирует вход в систему"""
    print("\n🔑 Тест входа...")
    
    data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=data)
        print(f"Статус: {response.status_code}")
        result = response.json()
        print(f"Ответ: {result}")
        
        if response.status_code == 200 and "token" in result:
            return result["token"]
        return None
    except Exception as e:
        print(f"Ошибка: {e}")
        return None

def test_model_request(token):
    """Тестирует запрос к AI модели"""
    print("\n🤖 Тест запроса к AI модели...")
    
    if not token:
        print("❌ Нет токена для тестирования")
        return False
    
    data = {
        "request": "Привет! Как дела?"
    }
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/request_to_model", json=data, headers=headers)
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Ошибка: {e}")
        return False

def main():
    print("🚀 Тестирование AltAI API")
    print("=" * 40)
    
    # Ждем запуска сервера
    print("⏳ Ожидание запуска сервера...")
    time.sleep(3)
    
    # Тест 1: Регистрация
    if test_register():
        print("✅ Регистрация прошла успешно")
    else:
        print("❌ Регистрация не удалась")
        return
    
    # Тест 2: Вход
    token = test_login()
    if token:
        print("✅ Вход выполнен успешно")
    else:
        print("❌ Вход не удался")
        return
    
    # Тест 3: Запрос к модели
    if test_model_request(token):
        print("✅ Запрос к AI модели прошел успешно")
    else:
        print("❌ Запрос к AI модели не удался")
    
    print("\n" + "=" * 40)
    print("🎉 Тестирование завершено!")

if __name__ == "__main__":
    main()

