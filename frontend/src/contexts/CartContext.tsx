import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  maxStock: number
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (product: {
    id: string
    name: string
    price: number
    imageUrl?: string
    stockQuantity: number
  }, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'petcare_cart'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on init
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Lưu ý: KHÔNG gọi toast bên trong hàm updater của setItems.
  // React StrictMode gọi updater 2 lần -> toast sẽ bị nhân đôi (x2).
  // Vì vậy mọi toast đều được gọi ngoài updater, dựa trên state hiện tại (items).
  const addToCart = useCallback((product: {
    id: string
    name: string
    price: number
    imageUrl?: string
    stockQuantity: number
  }, quantity = 1) => {
    const existingItem = items.find(item => item.productId === product.id)

    if (existingItem) {
      // Check stock limit
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stockQuantity) {
        toast.error(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`)
        return
      }

      toast.success(`Đã cập nhật số lượng trong giỏ hàng`)
      setItems(prev => prev.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ))
      return
    }

    // Add new item
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
    setItems(prev => [...prev, {
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      maxStock: product.stockQuantity
    }])
  }, [items])

  const removeFromCart = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId)
    if (item) {
      toast.success(`Đã xóa "${item.name}" khỏi giỏ hàng`)
    }
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [items])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    const item = items.find(i => i.productId === productId)
    if (item && quantity > item.maxStock) {
      toast.error(`Chỉ còn ${item.maxStock} sản phẩm trong kho`)
      return
    }

    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    ))
  }, [items, removeFromCart])

  const clearCart = useCallback(() => {
    setItems([])
    toast.success('Đã xóa toàn bộ giỏ hàng')
  }, [])

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.productId === productId)
  }, [items])

  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId)
    return item?.quantity || 0
  }, [items])

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
      getItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
