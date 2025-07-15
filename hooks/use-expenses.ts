"use client"

import { useState, useEffect } from "react"
import { supabase, type Expense } from "@/lib/supabase"

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Add new expense
  const addExpense = async (expense: Omit<Expense, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("expenses").insert([expense]).select().single()

      if (error) throw error
      setExpenses((prev) => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add expense"
      setError(message)
      return { success: false, error: message }
    }
  }

  // Update expense
  const updateExpense = async (id: string, updates: Partial<Omit<Expense, "id" | "created_at" | "updated_at">>) => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? data : exp)))
      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update expense"
      setError(message)
      return { success: false, error: message }
    }
  }

  // Delete expense
  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error
      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete expense"
      setError(message)
      return { success: false, error: message }
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  }
}
