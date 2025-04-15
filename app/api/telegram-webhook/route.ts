import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Telegram bot API token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Telegram API URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// Telegram bot komutları
const COMMANDS = {
  START: "/start",
  PRODUCTS: "/urunler",
  BALANCE: "/bakiye",
  ORDERS: "/siparislerim",
  ADD_BALANCE: "/bakiyeekle",
  HELP: "/yardim",
}

export async function POST(request: Request) {
  try {
    const update = await request.json()

    // Mesaj kontrolü
    if (!update.message) {
      return NextResponse.json({ status: "success" })
    }

    const message = update.message
    const chatId = message.chat.id
    const text = message.text
    const supabase = createClient()

    // Kullanıcı kontrolü ve kayıt
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("telegram_id", chatId).single()

    if (userError && userError.code === "PGRST116") {
      // Kullanıcı yoksa yeni kullanıcı oluştur
      const { error: insertError } = await supabase.from("users").insert([
        {
          telegram_id: chatId,
          username: message.from.username || null,
          first_name: message.from.first_name || null,
          last_name: message.from.last_name || null,
        },
      ])

      if (insertError) {
        console.error("Kullanıcı oluşturma hatası:", insertError)
        await sendMessage(chatId, "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
        return NextResponse.json({ status: "error", message: insertError.message })
      }
    }

    // Komut işleme
    if (text === COMMANDS.START) {
      await handleStartCommand(chatId, message.from.first_name)
    } else if (text === COMMANDS.PRODUCTS) {
      await handleProductsCommand(chatId)
    } else if (text === COMMANDS.BALANCE) {
      await handleBalanceCommand(chatId)
    } else if (text === COMMANDS.ORDERS) {
      await handleOrdersCommand(chatId)
    } else if (text === COMMANDS.ADD_BALANCE) {
      await handleAddBalanceCommand(chatId)
    } else if (text === COMMANDS.HELP) {
      await handleHelpCommand(chatId)
    } else if (text.startsWith("/siparis_")) {
      // Sipariş detayı komutu
      const orderId = text.split("_")[1]
      await handleOrderDetailCommand(chatId, orderId)
    } else if (text.startsWith("/satin_")) {
      // Ürün satın alma komutu
      const productId = text.split("_")[1]
      await handleBuyProductCommand(chatId, productId)
    } else {
      // Bilinmeyen komut
      await sendMessage(chatId, "Anlaşılamayan komut. Komutları görmek için /yardim yazabilirsiniz.")
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook hatası:", error)
    return NextResponse.json({ status: "error", message: error.message })
  }
}

// Telegram'a mesaj gönderme fonksiyonu
async function sendMessage(chatId: number, text: string, options = {}) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...options,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Telegram API hatası:", errorData)
    throw new Error(`Telegram API hatası: ${JSON.stringify(errorData)}`)
  }

  return await response.json()
}

// Komut işleme fonksiyonları
async function handleStartCommand(chatId: number, firstName: string) {
  const welcomeMessage = `Merhaba ${firstName || "Değerli Müşterimiz"}! 👋\n\nHat satış sistemimize hoş geldiniz. Aşağıdaki komutları kullanarak işlem yapabilirsiniz:\n\n/urunler - Mevcut hat ürünlerini görüntüle\n/bakiye - Bakiyeni görüntüle\n/bakiyeekle - Bakiye yükle\n/siparislerim - Siparişlerini görüntüle\n/yardim - Yardım menüsü`

  await sendMessage(chatId, welcomeMessage)
}

async function handleProductsCommand(chatId: number) {
  const supabase = createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("price", { ascending: true })

  if (error) {
    console.error("Ürünler yüklenirken hata:", error)
    await sendMessage(chatId, "Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!products || products.length === 0) {
    await sendMessage(chatId, "Şu anda satışta ürün bulunmamaktadır.")
    return
  }

  let productsMessage = "📱 <b>Mevcut Hat Ürünleri</b>\n\n"

  products.forEach((product) => {
    productsMessage += `<b>${product.name}</b>\n`
    productsMessage += `Fiyat: ₺${product.price.toFixed(2)}\n`
    if (product.description) {
      productsMessage += `Açıklama: ${product.description}\n`
    }
    productsMessage += `Stok: ${product.stock} adet\n`
    productsMessage += `\nSatın almak için: /satin_${product.id}\n\n`
    productsMessage += "------------------------\n\n"
  })

  await sendMessage(chatId, productsMessage)
}

async function handleBalanceCommand(chatId: number) {
  const supabase = createClient()

  const { data: user, error } = await supabase.from("users").select("balance").eq("telegram_id", chatId).single()

  if (error) {
    console.error("Bakiye sorgulanırken hata:", error)
    await sendMessage(chatId, "Bakiyeniz sorgulanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  const balanceMessage = `💰 <b>Mevcut Bakiyeniz</b>\n\n₺${user.balance.toFixed(2)}\n\nBakiye yüklemek için: /bakiyeekle`

  await sendMessage(chatId, balanceMessage)
}

async function handleOrdersCommand(chatId: number) {
  const supabase = createClient()

  // Önce kullanıcı ID'sini al
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("telegram_id", chatId).single()

  if (userError) {
    console.error("Kullanıcı sorgulanırken hata:", userError)
    await sendMessage(chatId, "Siparişleriniz sorgulanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Kullanıcının siparişlerini al
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      created_at,
      tracking_number
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("Siparişler sorgulanırken hata:", ordersError)
    await sendMessage(chatId, "Siparişleriniz sorgulanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!orders || orders.length === 0) {
    await sendMessage(chatId, "Henüz bir siparişiniz bulunmamaktadır.")
    return
  }

  let ordersMessage = "📦 <b>Siparişleriniz</b>\n\n"

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at).toLocaleDateString("tr-TR")
    const statusText = getOrderStatusText(order.status)

    ordersMessage += `<b>Sipariş #${order.id.substring(0, 8)}</b>\n`
    ordersMessage += `Tarih: ${orderDate}\n`
    ordersMessage += `Tutar: ₺${order.total_amount.toFixed(2)}\n`
    ordersMessage += `Durum: ${statusText}\n`

    if (order.tracking_number) {
      ordersMessage += `Kargo Takip No: ${order.tracking_number}\n`
    }

    ordersMessage += `\nDetaylar için: /siparis_${order.id}\n\n`
    ordersMessage += "------------------------\n\n"
  })

  await sendMessage(chatId, ordersMessage)
}

async function handleAddBalanceCommand(chatId: number) {
  const supabase = createClient()

  // Ödeme ayarlarını al
  const { data: paymentSettings, error } = await supabase.from("payment_settings").select("*").eq("active", true)

  if (error) {
    console.error("Ödeme ayarları sorgulanırken hata:", error)
    await sendMessage(chatId, "Ödeme bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (!paymentSettings || paymentSettings.length === 0) {
    await sendMessage(chatId, "Şu anda ödeme kabul edilmemektedir. Lütfen daha sonra tekrar deneyin.")
    return
  }

  let paymentMessage = "💳 <b>Bakiye Yükleme</b>\n\n"
  paymentMessage += "Bakiye yüklemek için aşağıdaki adımları takip edin:\n\n"
  paymentMessage += "1. Aşağıdaki ödeme yöntemlerinden birini seçin\n"
  paymentMessage += "2. Ödemeyi yapın ve açıklama kısmına Telegram kullanıcı adınızı yazın\n"
  paymentMessage += "3. Ödeme yaptıktan sonra bot üzerinden ödeme bilgilerinizi gönderin\n\n"
  paymentMessage += "<b>Ödeme Yöntemleri:</b>\n\n"

  const trxAccounts = paymentSettings.filter((p) => p.type === "trx")
  const ibanAccounts = paymentSettings.filter((p) => p.type === "iban")

  if (trxAccounts.length > 0) {
    paymentMessage += "🔹 <b>TRX (Tron) ile Ödeme</b>\n"
    trxAccounts.forEach((account) => {
      paymentMessage += `Adres: <code>${account.account}</code>\n\n`
    })
  }

  if (ibanAccounts.length > 0) {
    paymentMessage += "🔹 <b>Banka Havalesi ile Ödeme</b>\n"
    ibanAccounts.forEach((account) => {
      paymentMessage += `IBAN: <code>${account.account}</code>\n`
      if (account.account_name) {
        paymentMessage += `Hesap Sahibi: ${account.account_name}\n`
      }
      paymentMessage += "\n"
    })
  }

  paymentMessage += "Ödeme yaptıktan sonra, aşağıdaki bilgileri içeren bir mesaj gönderin:\n"
  paymentMessage += "- Ödeme tutarı\n"
  paymentMessage += "- Ödeme yöntemi (TRX veya IBAN)\n"
  paymentMessage += "- İşlem ID'si veya dekont bilgisi\n\n"
  paymentMessage += 'Örnek: "100 TL ödeme yaptım, TRX ile, işlem ID: ABC123"'

  await sendMessage(chatId, paymentMessage)
}

async function handleHelpCommand(chatId: number) {
  const helpMessage = `📌 <b>Yardım Menüsü</b>\n\n<b>Kullanılabilir Komutlar:</b>\n\n/urunler - Mevcut hat ürünlerini görüntüle\n/bakiye - Bakiyeni görüntüle\n/bakiyeekle - Bakiye yükle\n/siparislerim - Siparişlerini görüntüle\n/yardim - Bu yardım menüsünü görüntüle\n\n<b>Nasıl Çalışır?</b>\n\n1. /bakiyeekle komutu ile bakiye yükleyin\n2. /urunler komutu ile ürünleri görüntüleyin\n3. İstediğiniz ürünü satın alın\n4. /siparislerim komutu ile siparişlerinizi takip edin`

  await sendMessage(chatId, helpMessage)
}

async function handleOrderDetailCommand(chatId: number, orderId: string) {
  const supabase = createClient()

  // Önce kullanıcı ID'sini al
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("telegram_id", chatId).single()

  if (userError) {
    console.error("Kullanıcı sorgulanırken hata:", userError)
    await sendMessage(chatId, "Sipariş detayları sorgulanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Siparişi ve sipariş öğelerini al
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          name
        )
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (orderError) {
    console.error("Sipariş sorgulanırken hata:", orderError)
    await sendMessage(chatId, "Sipariş detayları sorgulanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Kargo güncellemelerini al
  const { data: shippingUpdates, error: shippingError } = await supabase
    .from("shipping_updates")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })

  if (shippingError) {
    console.error("Kargo güncellemeleri sorgulanırken hata:", shippingError)
  }

  const orderDate = new Date(order.created_at).toLocaleDateString("tr-TR")
  const statusText = getOrderStatusText(order.status)

  let orderMessage = `📦 <b>Sipariş Detayı #${order.id.substring(0, 8)}</b>\n\n`
  orderMessage += `Tarih: ${orderDate}\n`
  orderMessage += `Durum: ${statusText}\n`
  orderMessage += `Toplam Tutar: ₺${order.total_amount.toFixed(2)}\n\n`

  if (order.shipping_address) {
    orderMessage += `<b>Teslimat Adresi:</b>\n${order.shipping_address}\n\n`
  }

  if (order.tracking_number) {
    orderMessage += `<b>Kargo Takip No:</b> ${order.tracking_number}\n\n`
  }

  orderMessage += "<b>Ürünler:</b>\n"
  order.order_items.forEach((item) => {
    orderMessage += `- ${item.products.name} x ${item.quantity}: ₺${item.price.toFixed(2)}\n`
  })

  if (shippingUpdates && shippingUpdates.length > 0) {
    orderMessage += "\n<b>Kargo Durumu:</b>\n"
    shippingUpdates.forEach((update) => {
      const updateDate = new Date(update.created_at).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      orderMessage += `${updateDate} - ${update.status}`
      if (update.description) {
        orderMessage += `: ${update.description}`
      }
      orderMessage += "\n"
    })
  }

  await sendMessage(chatId, orderMessage)
}

async function handleBuyProductCommand(chatId: number, productId: string) {
  const supabase = createClient()

  // Ürün bilgilerini al
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("active", true)
    .single()

  if (productError) {
    console.error("Ürün sorgulanırken hata:", productError)
    await sendMessage(chatId, "Ürün bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  if (product.stock <= 0) {
    await sendMessage(chatId, "Üzgünüz, bu ürün şu anda stokta bulunmamaktadır.")
    return
  }

  // Kullanıcı bilgilerini al
  const { data: user, error: userError } = await supabase.from("users").select("*").eq("telegram_id", chatId).single()

  if (userError) {
    console.error("Kullanıcı sorgulanırken hata:", userError)
    await sendMessage(chatId, "Kullanıcı bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    return
  }

  // Bakiye kontrolü
  if (user.balance < product.price) {
    await sendMessage(
      chatId,
      `Yetersiz bakiye. Ürün fiyatı: ₺${product.price.toFixed(2)}, Bakiyeniz: ₺${user.balance.toFixed(2)}\n\nBakiye yüklemek için: /bakiyeekle`,
    )
    return
  }

  // Satın alma işlemi
  try {
    // Sipariş oluştur
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: user.id,
          status: "paid",
          total_amount: product.price,
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    // Sipariş öğesi oluştur
    const { error: itemError } = await supabase.from("order_items").insert([
      {
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        price: product.price,
      },
    ])

    if (itemError) throw itemError

    // Stok güncelle
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product.id)

    if (stockError) throw stockError

    // Bakiye güncelle
    const { error: balanceError } = await supabase
      .from("users")
      .update({ balance: user.balance - product.price })
      .eq("id", user.id)

    if (balanceError) throw balanceError

    // Başarılı mesajı gönder
    const successMessage = `✅ <b>Satın Alma Başarılı!</b>\n\n<b>${product.name}</b> ürününü başarıyla satın aldınız.\n\nSipariş No: #${order.id.substring(0, 8)}\nTutar: ₺${product.price.toFixed(2)}\nYeni Bakiyeniz: ₺${(user.balance - product.price).toFixed(2)}\n\nSiparişiniz en kısa sürede işleme alınacaktır. Siparişlerinizi görmek için: /siparislerim`

    await sendMessage(chatId, successMessage)
  } catch (error) {
    console.error("Satın alma işlemi sırasında hata:", error)
    await sendMessage(chatId, "Satın alma işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
  }
}

// Yardımcı fonksiyonlar
function getOrderStatusText(status: string): string {
  switch (status) {
    case "pending":
      return "Beklemede"
    case "processing":
      return "Hazırlanıyor"
    case "shipped":
      return "Kargoya Verildi"
    case "delivered":
      return "Teslim Edildi"
    case "completed":
      return "Tamamlandı"
    case "cancelled":
      return "İptal Edildi"
    case "refunded":
      return "İade Edildi"
    case "paid":
      return "Ödendi"
    default:
      return "Bilinmeyen Durum"
  }
}
