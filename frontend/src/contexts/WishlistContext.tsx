import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  comparePrice?: number
  imageUrl?: string
  stockQuantity: number
  addedAt: string
}

interface WishlistContextType {
  items: WishlistItem[]
  totalItems: number
  addToWishlist: (product: {
    id: string
    name: string
    price: number
    comparePrice?: number
    imageUrl?: string
    stockQuantity: number
  }) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (product: {
    id: string
    name: string
    price: number
    comparePrice?: number
    imageUrl?: string
    stockQuantity: number
  }) => void
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const WISHLIST_STORAGE_KEY = 'petcare_wishlist'

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)
      return savedWishlist ? JSON.parse(savedWishlist) : []
    } catch {
      return []
    }
  })

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const totalItems = items.length

  const addToWishlist = useCallback((product: {
    id: string
    name: string
    price: number
    comparePrice?: number
    imageUrl?: string
    stockQuantity: number
  }) => {
    setItems(prev => {
      const exists = prev.find(item => item.productId === product.id)
      if (exists) {
        toast.error('Sản phẩm đã có trong danh sách yêu thích')
        return prev
      }

      toast.success(`Đã thêm "${product.name}" vào yêu thích`)
      return [...prev, {
        id: `wishlist-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        addedAt: new Date().toISOString()
      }]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.productId === productId)
      if (item) {
        toast.success(`Đã xóa "${item.name}" khỏi yêu thích`)
      }
      return prev.filter(item => item.productId !== productId)
    })
  }, [])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.productId === productId)
  }, [items])

  const toggleWishlist = useCallback((product: {
    id: string
    name: string
    price: number
    comparePrice?: number
    imageUrl?: string
    stockQuantity: number
  }) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist])

  const clearWishlist = useCallback(() => {
    setItems([])
    toast.success('Đã xóa toàn bộ danh sách yêu thích')
  }, [])

  return (
    <WishlistContext.Provider value={{
      items,
      totalItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
