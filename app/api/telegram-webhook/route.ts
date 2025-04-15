import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Telegram bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Telegram API URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Telegram mesajı gönderme fonksiyonu
async function sendMessage(chat_id: number, text: string, reply_markup?: any) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id,
      text,
      parse_mode: "HTML",
      reply_markup,
    }),
  })

  return response.json()
}

// Ana menü klavyesi
const mainMenuKeyboard = {
  keyboard: [
    [{ text: "🛒 Ürünler" }, { text: "🛍️ Sepetim" }],
    [{ text: "📦 Siparişlerim" }, { text: "💰 Bakiyem" }],
    [{ text: "❓ Yardım" }],
  ],
  resize_keyboard: true,
}

// Kullanıcı kaydı fonksiyonu
async function registerUser(supabase: any, telegramUser: any) {
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select()
    .eq("telegram_id", telegramUser.id)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Kullanıcı sorgulama hatası:", fetchError)
    return null
  }

  if (existingUser) {
    // Kullanıcı zaten kayıtlı, bilgilerini güncelle
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        username: telegramUser.username || existingUser.username,
        first_name: telegramUser.first_name || existingUser.first_name,
        last_name: telegramUser.last_name || existingUser.last_name,
        updated_at: new Date().toISOString(),
      })
      .eq("telegram_id", telegramUser.id)
      .select()
      .single()

    if (updateError) {
      console.error("Kullanıcı güncelleme hatası:", updateError)
      return existingUser
    }

    return updatedUser
  } else {
    // Yeni kullanıcı oluştur
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        telegram_id: telegramUser.id,
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        balance: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Kullanıcı oluşturma hatası:", insertError)
      return null
    }

    return newUser
  }
}

// Ürünleri listeleme fonksiyonu
async function listProducts(supabase: any, chat_id: number) {
  const { data: products, error } = await supabase.from("products").select("*").eq("active", true).order("name")

  if (error) {
    console.error("Ürün listeleme hatası:", error)
    await sendMessage(chat_id, "Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!products || products.length === 0) {
    await sendMessage(chat_id, "Şu anda satışta ürün bulunmamaktadır.")
    return
  }

  let message = "<b>📦 Mevcut Ürünler</b>\n\n"

  for (const product of products) {
    message += `<b>${product.name}</b>\n`
    message += `Fiyat: ${product.price} ₺\n`
    if (product.description) {
      message += `Açıklama: ${product.description}\n`
    }
    message += `Stok: ${product.stock > 0 ? product.stock : "Tükendi"}\n\n`
  }

  message += "Ürün satın almak için lütfen yönetici ile iletişime geçin."

  await sendMessage(chat_id, message)
}

// Webhook handler
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const update = await request.json()

    // Mesaj kontrolü
    if (!update.message) {
      return NextResponse.json({ status: "No message found" })
    }

    const message = update.message
    const { chat_id, text, from } = message
    // const user = message.from;
    // Kullanıcıyı kaydet/güncelle
    const dbUser = await registerUser(supabase, from)

    if (!dbUser) {
      await sendMessage(chat_id, "Kullanıcı kaydı sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      return NextResponse.json({ status: "User registration failed" })
    }

    // Komut işleme
    if (text === "/start") {
      await sendMessage(
        chat_id,
        `Merhaba <b>${from.first_name || "Değerli Müşterimiz"}</b>! 👋\n\nŞapka Satış Sistemine hoş geldiniz. Aşağıdaki menüden istediğiniz işlemi seçebilirsiniz.`,
        mainMenuKeyboard,
      )
    } else if (text === "/menu" || text === "Ana Menü") {
      await sendMessage(chat_id, "Ana menü:", mainMenuKeyboard)
    } else if (text === "/products" || text === "🛒 Ürünler") {
      await listProducts(supabase, chat_id)
    } else if (text === "/cart" || text === "🛍️ Sepetim") {
      await sendMessage(chat_id, "Sepet özelliği yakında eklenecektir.")
    } else if (text === "/orders" || text === "📦 Siparişlerim") {
      await sendMessage(chat_id, "Sipariş geçmişi özelliği yakında eklenecektir.")
    } else if (text === "/balance" || text === "💰 Bakiyem") {
      await sendMessage(chat_id, `Mevcut bakiyeniz: ${dbUser.balance} ₺`)
    } else if (text === "/help" || text === "❓ Yardım") {
      await sendMessage(
        chat_id,
        "Yardım için lütfen yönetici ile iletişime geçin.\n\nKullanılabilir komutlar:\n/start - Botu başlat\n/menu - Ana menüyü göster\n/products - Ürünleri listele\n/cart - Sepeti göster\n/orders - Siparişlerimi göster\n/balance - Bakiyemi göster\n/help - Yardım",
      )
    } else {
      await sendMessage(chat_id, "Anlaşılamayan komut. Lütfen menüden bir seçenek seçin veya /help yazın.")
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook işleme hatası:", error)
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 })
  }
}
