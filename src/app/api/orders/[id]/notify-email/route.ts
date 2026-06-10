import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNyBestallning } from '@/lib/emails/nyBestallning'
import { sendBestallningGodkand } from '@/lib/emails/bestallningGodkand'
import { sendBestallningNekad } from '@/lib/emails/bestallningNekad'

type OrderRow = {
  id: string
  service_title: string
  seller_id: string
  seller_name: string
  buyer_id: string
  buyer_name: string
  message: string | null
  created_at: string
  price_type: string | null
  active_price: number | null
  initial_price: number | null
  hourly_rate: number | null
}

function formatPrice(order: OrderRow) {
  if (order.price_type === 'offert') return 'Offert'
  if (order.active_price != null) return `${order.active_price.toLocaleString('sv-SE')} kr`
  if (order.initial_price != null) return `${order.initial_price.toLocaleString('sv-SE')} kr`
  if (order.hourly_rate != null) return `${order.hourly_rate.toLocaleString('sv-SE')} kr/h`
  return 'Offert'
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { type } = await req.json()

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, service_title, seller_id, seller_name, buyer_id, buyer_name, message, created_at, price_type, active_price, initial_price, hourly_rate')
      .eq('id', id)
      .single<OrderRow>()

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const baseUrl = req.nextUrl.origin

    if (type === 'new_order') {
      const { data: seller } = await supabaseAdmin.from('users').select('email').eq('id', order.seller_id).single()
      if (!seller?.email) {
        return NextResponse.json({ success: false, error: 'Seller email not found' }, { status: 404 })
      }

      await sendNyBestallning({
        to: seller.email,
        sellerName: order.seller_name,
        serviceTitle: order.service_title,
        buyerName: order.buyer_name,
        price: formatPrice(order),
        orderDate: formatDate(order.created_at),
        buyerMessage: order.message ?? undefined,
        orderUrl: `${baseUrl}/order/${order.id}`,
      })
    } else if (type === 'accepted' || type === 'rejected') {
      const { data: buyer } = await supabaseAdmin.from('users').select('email').eq('id', order.buyer_id).single()
      if (!buyer?.email) {
        return NextResponse.json({ success: false, error: 'Buyer email not found' }, { status: 404 })
      }

      if (type === 'accepted') {
        await sendBestallningGodkand({
          to: buyer.email,
          buyerName: order.buyer_name,
          serviceTitle: order.service_title,
          sellerName: order.seller_name,
          price: formatPrice(order),
          orderUrl: `${baseUrl}/my-order/${order.id}`,
        })
      } else {
        await sendBestallningNekad({
          to: buyer.email,
          buyerName: order.buyer_name,
          serviceTitle: order.service_title,
          sellerName: order.seller_name,
          orderUrl: `${baseUrl}/my-order/${order.id}`,
        })
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order notification email error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
