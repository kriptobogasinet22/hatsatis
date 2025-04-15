import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Telegram bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Telegram API URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Kullanıcı durumlarını saklamak için basit bir in-memory store
// Not: Gerçek bir uygulamada bu verileri veritabanında saklamalısınız
const userStates: Record<
  number,
  {
    state: string
    data?: any
  }
> = {}

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
    [{ text: "📦 Siparişlerim" }, { text: "❓ Yardım" }],
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

  // Her ürün için bir buton oluştur
  const keyboard = products.map((product) => {
    return [{ text: `${product.name} - ${product.price} ₺`, callback_data: `product:${product.id}` }]
  })

  // Ürünleri inline keyboard ile göster
  await sendMessage(chat_id, "<b>📦 Mevcut Ürünler</b>\n\nSatın almak istediğiniz ürünü seçin:", {
    inline_keyboard: keyboard,
  })
}

// Ürün detaylarını gösterme fonksiyonu
async function showProductDetails(supabase: any, chat_id: number, product_id: string) {
  const { data: product, error } = await supabase.from("products").select("*").eq("id", product_id).single()

  if (error || !product) {
    console.error("Ürün detayları yüklenirken hata:", error)
    await sendMessage(chat_id, "Ürün detayları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  let message = `<b>${product.name}</b>\n\n`
  message += `Fiyat: ${product.price} ₺\n`
  if (product.description) {
    message += `Açıklama: ${product.description}\n`
  }
  message += `Stok: ${product.stock > 0 ? product.stock : "Tükendi"}\n\n`

  if (product.stock <= 0) {
    message += "Bu ürün şu anda stokta bulunmamaktadır."
    await sendMessage(chat_id, message)
    return
  }

  // Satın alma butonu ekle
  const keyboard = {
    inline_keyboard: [
      [{ text: "🛒 Satın Al", callback_data: `buy:${product.id}` }],
      [{ text: "◀️ Geri", callback_data: "list_products" }],
    ],
  }

  await sendMessage(chat_id, message, keyboard)
}

// Ödeme yöntemlerini listeleme fonksiyonu
async function showPaymentMethods(supabase: any, chat_id: number, product_id: string) {
  // Ürün bilgilerini al
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single()

  if (productError || !product) {
    console.error("Ürün bilgileri yüklenirken hata:", productError)
    await sendMessage(chat_id, "Ürün bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Kullanıcı durumunu güncelle - adres isteme aşamasına geç
  userStates[chat_id] = {
    state: "waiting_for_address",
    data: { product_id: product.id, product_name: product.name, price: product.price },
  }

  await sendMessage(
    chat_id,
    `<b>${product.name}</b> ürününü satın almak için lütfen teslimat adresinizi yazın:\n\nTutar: ${product.price} ₺`,
    {
      inline_keyboard: [[{ text: "◀️ İptal", callback_data: `product:${product_id}` }]],
    },
  )
}

// Ödeme yöntemlerini gösterme (adres alındıktan sonra)
async function showPaymentMethodsAfterAddress(supabase: any, chat_id: number, address: string) {
  // Kullanıcı durumunu kontrol et
  const userState = userStates[chat_id]
  if (!userState || userState.state !== "waiting_for_address" || !userState.data) {
    await sendMessage(chat_id, "Bir hata oluştu. Lütfen tekrar ürün seçin.")
    return
  }

  // Ödeme yöntemlerini al
  const { data: paymentMethods, error: paymentError } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("active", true)

  if (paymentError) {
    console.error("Ödeme yöntemleri yüklenirken hata:", paymentError)
    await sendMessage(chat_id, "Ödeme yöntemleri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    await sendMessage(chat_id, "Şu anda aktif ödeme yöntemi bulunmamaktadır. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Kullanıcı durumunu güncelle - adresi kaydet
  userStates[chat_id] = {
    state: "selecting_payment",
    data: { ...userState.data, shipping_address: address },
  }

  // Ödeme yöntemlerini butonlar olarak göster
  const keyboard = paymentMethods.map((method) => {
    let methodName = ""
    switch (method.type) {
      case "bank":
        methodName = "Banka Havalesi"
        break
      case "paypal":
        methodName = "PayPal"
        break
      case "crypto":
        methodName = "Kripto Para"
        break
      default:
        methodName = method.type
    }
    return [{ text: methodName, callback_data: `payment:${method.id}` }]
  })

  // Geri butonu ekle
  keyboard.push([{ text: "◀️ İptal", callback_data: `buy:${userState.data.product_id}` }])

  await sendMessage(
    chat_id,
    `<b>${userState.data.product_name}</b> ürününü satın almak için bir ödeme yöntemi seçin:\n\nTutar: ${userState.data.price} ₺\nTeslimat Adresi: ${address}`,
    { inline_keyboard: keyboard },
  )
}

// Ödeme detaylarını gösterme fonksiyonu
async function showPaymentDetails(supabase: any, chat_id: number, payment_id: string) {
  // Ödeme yöntemi bilgilerini al
  const { data: paymentMethod, error } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("id", payment_id)
    .single()

  if (error || !paymentMethod) {
    console.error("Ödeme yöntemi bilgileri yüklenirken hata:", error)
    await sendMessage(chat_id, "Ödeme yöntemi bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Kullanıcı durumunu kontrol et
  const userState = userStates[chat_id]
  if (!userState || userState.state !== "selecting_payment" || !userState.data) {
    await sendMessage(chat_id, "Bir hata oluştu. Lütfen tekrar ürün seçin.")
    return
  }

  // Kullanıcı durumunu güncelle
  userStates[chat_id] = {
    state: "confirming_payment",
    data: { ...userState.data, payment_id: paymentMethod.id, payment_type: paymentMethod.type },
  }

  let methodName = ""
  switch (paymentMethod.type) {
    case "bank":
      methodName = "Banka Havalesi"
      break
    case "paypal":
      methodName = "PayPal"
      break
    case "crypto":
      methodName = "Kripto Para"
      break
    default:
      methodName = paymentMethod.type
  }

  let message = `<b>Ödeme Detayları</b>\n\n`
  message += `Ürün: ${userState.data.product_name}\n`
  message += `Tutar: ${userState.data.price} ₺\n`
  message += `Ödeme Yöntemi: ${methodName}\n`
  message += `Teslimat Adresi: ${userState.data.shipping_address}\n\n`
  message += `<b>Ödeme Bilgileri:</b>\n`
  message += `${paymentMethod.account}\n`
  if (paymentMethod.account_name) {
    message += `Hesap Adı: ${paymentMethod.account_name}\n`
  }
  message += `\nLütfen yukarıdaki hesaba ödemeyi yapın ve aşağıdaki "Ödemeyi Onaylıyorum" butonuna tıklayın. Ödemeniz yönetici tarafından onaylandıktan sonra siparişiniz işleme alınacaktır.`

  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ Ödemeyi Onaylıyorum", callback_data: "confirm_payment" }],
      [{ text: "◀️ Geri", callback_data: `buy:${userState.data.product_id}` }],
    ],
  }

  await sendMessage(chat_id, message, keyboard)
}

// Ödeme onayı alma fonksiyonu
async function confirmPayment(supabase: any, chat_id: number, user_id: string) {
  // Kullanıcı durumunu kontrol et
  const userState = userStates[chat_id]
  if (!userState || userState.state !== "confirming_payment" || !userState.data) {
    await sendMessage(chat_id, "Bir hata oluştu. Lütfen tekrar ürün seçin.")
    return
  }

  try {
    // Sipariş oluştur
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        status: "pending",
        total_amount: userState.data.price,
        shipping_address: userState.data.shipping_address,
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Sipariş öğesi oluştur
    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: userState.data.product_id,
      quantity: 1,
      price: userState.data.price,
    })

    if (itemError) {
      throw itemError
    }

    // Ödeme talebi oluştur
    const { error: paymentError } = await supabase.from("payment_requests").insert({
      user_id,
      amount: userState.data.price,
      payment_method: userState.data.payment_type,
      payment_details: `Ürün: ${userState.data.product_name}, Sipariş ID: ${order.id}`,
      status: "pending",
    })

    if (paymentError) {
      throw paymentError
    }

    // Kullanıcı durumunu temizle
    delete userStates[chat_id]

    // Başarılı mesajı gönder
    await sendMessage(
      chat_id,
      `✅ Ödeme talebiniz alınmıştır!\n\nSipariş numaranız: ${order.id}\n\nÖdemeniz yönetici tarafından onaylandıktan sonra siparişiniz işleme alınacaktır. Sipariş durumunuzu "📦 Siparişlerim" menüsünden takip edebilirsiniz.`,
      mainMenuKeyboard,
    )
  } catch (error) {
    console.error("Ödeme onayı sırasında hata:", error)
    await sendMessage(chat_id, "Ödeme işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

// Kullanıcının siparişlerini listeleme fonksiyonu
async function listOrders(supabase: any, chat_id: number, user_id: string) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (name)
      )
    `)
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Siparişler yüklenirken hata:", error)
    await sendMessage(chat_id, "Siparişleriniz yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!orders || orders.length === 0) {
    await sendMessage(chat_id, "Henüz bir siparişiniz bulunmamaktadır.")
    return
  }

  let message = "<b>📦 Siparişleriniz</b>\n\n"

  for (const order of orders) {
    const orderDate = new Date(order.created_at).toLocaleDateString("tr-TR")
    let statusText = ""

    switch (order.status) {
      case "pending":
        statusText = "Beklemede"
        break
      case "processing":
        statusText = "İşleniyor"
        break
      case "shipped":
        statusText = "Kargoya Verildi"
        break
      case "delivered":
        statusText = "Teslim Edildi"
        break
      default:
        statusText = order.status
    }

    message += `<b>Sipariş #${order.id.substring(0, 8)}</b>\n`
    message += `Tarih: ${orderDate}\n`
    message += `Tutar: ${order.total_amount} ₺\n`
    message += `Durum: ${statusText}\n`
    message += `Adres: ${order.shipping_address || "Belirtilmemiş"}\n`

    if (order.tracking_number) {
      message += `Takip No: ${order.tracking_number}\n`
    }

    if (order.order_items && order.order_items.length > 0) {
      message += "Ürünler:\n"
      for (const item of order.order_items) {
        const productName = item.products ? item.products.name : "Bilinmeyen Ürün"
        message += `- ${productName} x${item.quantity}\n`
      }
    }

    message += "\n"
  }

  await sendMessage(chat_id, message)
}

// GET isteği için handler ekledik
export async function GET(request: Request) {
  return NextResponse.json({
    status: "ok",
    message: "Telegram Webhook endpoint'i aktif. Bu endpoint POST istekleri için tasarlanmıştır.",
    info: "Webhook'u test etmek için /api/telegram-test endpoint'ini kullanın.",
  })
}

// Webhook handler
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const update = await request.json()

    console.log("Telegram webhook alındı:", JSON.stringify(update))

    // Callback query işleme (butonlara tıklama)
    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chat_id = callbackQuery.message.chat.id
      const data = callbackQuery.data
      const from = callbackQuery.from

      console.log(`Callback query alındı - Chat ID: ${chat_id}, Data: ${data}`)

      // Kullanıcıyı kaydet/güncelle
      const dbUser = await registerUser(supabase, from)

      if (!dbUser) {
        await sendMessage(chat_id, "Kullanıcı kaydı sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
        return NextResponse.json({ status: "User registration failed" })
      }

      // Callback data işleme
      if (data.startsWith("product:")) {
        // Ürün detaylarını göster
        const product_id = data.split(":")[1]
        await showProductDetails(supabase, chat_id, product_id)
      } else if (data === "list_products") {
        // Ürünleri listele
        await listProducts(supabase, chat_id)
      } else if (data.startsWith("buy:")) {
        // Ödeme yöntemlerini göster
        const product_id = data.split(":")[1]
        await showPaymentMethods(supabase, chat_id, product_id)
      } else if (data.startsWith("payment:")) {
        // Ödeme detaylarını göster
        const payment_id = data.split(":")[1]
        await showPaymentDetails(supabase, chat_id, payment_id)
      } else if (data === "confirm_payment") {
        // Ödemeyi onayla
        await confirmPayment(supabase, chat_id, dbUser.id)
      }

      // Callback query'yi yanıtla (gerekli)
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
        }),
      })

      return NextResponse.json({ status: "success" })
    }

    // Normal mesaj işleme
    if (!update.message) {
      return NextResponse.json({ status: "No message found" })
    }

    const message = update.message
    const chat_id = message.chat.id
    const text = message.text || ""
    const from = message.from

    console.log(`Mesaj alındı - Chat ID: ${chat_id}, Text: ${text}`)

    // Kullanıcıyı kaydet/güncelle
    const dbUser = await registerUser(supabase, from)

    if (!dbUser) {
      await sendMessage(chat_id, "Kullanıcı kaydı sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      return NextResponse.json({ status: "User registration failed" })
    }

    // Kullanıcı durumunu kontrol et - adres bekliyorsak
    if (userStates[chat_id] && userStates[chat_id].state === "waiting_for_address") {
      await showPaymentMethodsAfterAddress(supabase, chat_id, text)
      return NextResponse.json({ status: "success" })
    }

    // Komut işleme
    if (text === "/start") {
      await sendMessage(
        chat_id,
        `Merhaba <b>${from.first_name || "Değerli Müşterimiz"}</b>! 👋\n\nAçık Hat Satış Sistemine hoş geldiniz. Aşağıdaki menüden istediğiniz işlemi seçebilirsiniz.`,
        mainMenuKeyboard,
      )
    } else if (text === "/menu" || text === "Ana Menü") {
      await sendMessage(chat_id, "Ana menü:", mainMenuKeyboard)
    } else if (text === "/products" || text === "🛒 Ürünler") {
      await listProducts(supabase, chat_id)
    } else if (text === "/cart" || text === "🛍️ Sepetim") {
      await sendMessage(chat_id, "Sepet özelliği yakında eklenecektir.")
    } else if (text === "/orders" || text === "📦 Siparişlerim") {
      await listOrders(supabase, chat_id, dbUser.id)
    } else if (text === "/help" || text === "❓ Yardım") {
      await sendMessage(
        chat_id,
        "Yardım için lütfen yönetici ile iletişime geçin.\n\nKullanılabilir komutlar:\n/start - Botu başlat\n/menu - Ana menüyü göster\n/products - Ürünleri listele\n/cart - Sepeti göster\n/orders - Siparişlerimi göster\n/help - Yardım",
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
