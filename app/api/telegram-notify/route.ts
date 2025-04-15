import { NextResponse } from "next/server"

// Telegram bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Telegram API URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function POST(request: Request) {
  try {
    const { chat_id, message } = await request.json()

    if (!chat_id || !message) {
      return NextResponse.json(
        { status: "error", message: "chat_id ve message parametreleri gereklidir" },
        { status: 400 },
      )
    }

    // Telegram mesajı gönder
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      throw new Error(`Telegram API hatası: ${JSON.stringify(result)}`)
    }

    return NextResponse.json({
      status: "success",
      message: "Bildirim başarıyla gönderildi",
      result,
    })
  } catch (error) {
    console.error("Telegram bildirimi gönderilirken hata:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Bildirim gönderilirken bir hata oluştu",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
