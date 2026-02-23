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

  const addToCart = useCallback((product: {
    id: string
    name: string
    price: number
    imageUrl?: string
    stockQuantity: number
  }, quantity = 1) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id)

      if (existingItem) {
        // Check stock limit
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity > product.stockQuantity) {
          toast.error(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`)
          return prev
        }

        toast.success(`Đã cập nhật số lượng trong giỏ hàng`)
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      }

      // Add new item
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng`)
      return [...prev, {
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl,
        maxStock: product.stockQuantity
      }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.productId === productId)
      if (item) {
        toast.success(`Đã xóa "${item.name}" khỏi giỏ hàng`)
      }
      return prev.filter(item => item.productId !== productId)
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    setItems(prev => prev.map(item => {
      if (item.productId === productId) {
        if (quantity > item.maxStock) {
          toast.error(`Chỉ còn ${item.maxStock} sản phẩm trong kho`)
          return item
        }
        return { ...item, quantity }
      }
      return item
    }))
  }, [removeFromCart])

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
