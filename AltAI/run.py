#!/usr/bin/env python3
"""
Скрипт для запуска AltAI проекта
"""

import subprocess
import sys
import os
import webbrowser
import time
from pathlib import Path

def check_dependencies():
    """Проверяет установлены ли необходимые зависимости"""
    try:
        import flask
        import flask_cors
        import jwt
        import huggingface_hub
        print("✅ Все зависимости установлены")
        return True
    except ImportError as e:
        print(f"❌ Отсутствует зависимость: {e}")
        print("Установите зависимости командой: pip install -r requirements.txt")
        return False

def install_dependencies():
    """Устанавливает зависимости"""
    print("📦 Установка зависимостей...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Зависимости установлены успешно")
        return True
    except subprocess.CalledProcessError:
        print("❌ Ошибка при установке зависимостей")
        return False

def start_backend():
    """Запускает бэкенд"""
    print("🚀 Запуск бэкенда на порту 8070...")
    try:
        # Запускаем бэкенд в фоне
        process = subprocess.Popen([sys.executable, "main.py"])
        time.sleep(3)  # Даем время на запуск
        
        # Проверяем, что сервер запустился
        import requests
        try:
            response = requests.get("http://localhost:8070/", timeout=5)
            print("✅ Бэкенд успешно запущен")
            return process
        except:
            print("❌ Бэкенд не отвечает")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка запуска бэкенда: {e}")
        return None

def open_frontend():
    """Открывает фронтенд в браузере"""
    frontend_path = Path("frontend/index.html")
    if frontend_path.exists():
        print("🌐 Открытие фронтенда в браузере...")
        webbrowser.open(frontend_path.as_uri())
    else:
        print("❌ Файл фронтенда не найден")

def main():
    print("🤖 AltAI - Запуск проекта")
    print("=" * 40)
    
    # Проверяем зависимости
    if not check_dependencies():
        print("\nУстановить зависимости автоматически? (y/n): ", end="")
        if input().lower() == 'y':
            if not install_dependencies():
                return
        else:
            return
    
    print("\n1. Запуск бэкенда...")
    backend_process = start_backend()
    
    if backend_process:
        print("\n2. Открытие фронтенда...")
        open_frontend()
        
        print("\n" + "=" * 40)
        print("🎉 Проект запущен!")
        print("📱 Бэкенд: http://localhost:8070")
        print("🌐 Фронтенд: frontend/index.html")
        print("\nДля остановки нажмите Ctrl+C")
        
        try:
            # Ждем завершения
            backend_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Остановка сервера...")
            backend_process.terminate()
            print("✅ Сервер остановлен")
    else:
        print("❌ Не удалось запустить проект")

if __name__ == "__main__":
    main()

