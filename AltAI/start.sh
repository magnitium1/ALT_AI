#!/bin/bash

echo "🚀 Запуск AltAI приложения..."

# Проверяем, установлены ли зависимости
if [ ! -f "requirements.txt" ]; then
    echo "❌ Файл requirements.txt не найден"
    exit 1
fi

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
pip install -r requirements.txt

# Проверяем наличие файла .env
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Копируем из env.txt..."
    cp ../env.txt .env
fi

# Запускаем приложение
echo "🌟 Запуск сервера на порту 8070..."
python main.py
