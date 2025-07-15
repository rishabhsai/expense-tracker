"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Filter, Trash2, Edit3, Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExpenses } from "@/hooks/use-expenses"

export default function ExpenseTracker() {
  const { expenses, loading, error, addExpense, updateExpense, deleteExpense } = useExpenses()

  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const [newExpense, setNewExpense] = useState({
    name: "",
    project: "",
    cost: "",
    billing: "monthly" as "monthly" | "yearly",
    category: "",
  })

  const projects = useMemo(() => {
    const projectSet = new Set(expenses.map((exp) => exp.project))
    return Array.from(projectSet)
  }, [expenses])

  const categories = useMemo(() => {
    const categorySet = new Set(expenses.map((exp) => exp.category))
    return Array.from(categorySet)
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.project.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProject = projectFilter === "all" || exp.project === projectFilter
      const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter

      return matchesSearch && matchesProject && matchesCategory
    })
  }, [expenses, searchTerm, projectFilter, categoryFilter])

  const totalMonthlyCost = useMemo(() => {
    return filteredExpenses.reduce((total, exp) => {
      const monthlyCost = exp.billing === "yearly" ? exp.cost / 12 : exp.cost
      return total + monthlyCost
    }, 0)
  }, [filteredExpenses])

  const totalYearlyCost = totalMonthlyCost * 12

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.project || !newExpense.cost) return

    setSubmitting(true)
    const result = await addExpense({
      name: newExpense.name,
      project: newExpense.project,
      cost: Number.parseFloat(newExpense.cost),
      billing: newExpense.billing,
      category: newExpense.category || "Other",
    })

    if (result.success) {
      setNewExpense({ name: "", project: "", cost: "", billing: "monthly", category: "" })
      setIsAddDialogOpen(false)
    }
    setSubmitting(false)
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setNewExpense({
      name: expense.name,
      project: expense.project,
      cost: expense.cost.toString(),
      billing: expense.billing,
      category: expense.category,
    })
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense || !newExpense.name || !newExpense.project || !newExpense.cost) return

    setSubmitting(true)
    const result = await updateExpense(editingExpense.id, {
      name: newExpense.name,
      project: newExpense.project,
      cost: Number.parseFloat(newExpense.cost),
      billing: newExpense.billing,
      category: newExpense.category || "Other",
    })

    if (result.success) {
      setEditingExpense(null)
      setNewExpense({ name: "", project: "", cost: "", billing: "monthly", category: "" })
    }
    setSubmitting(false)
  }

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id)
  }

  const resetForm = () => {
    setNewExpense({ name: "", project: "", cost: "", billing: "monthly", category: "" })
    setEditingExpense(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-purple-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading expenses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-800 bg-red-900/20 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Expense Tracker</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and track your project expenses & subscriptions</p>
          </div>

          <Dialog
            open={isAddDialogOpen || !!editingExpense}
            onOpenChange={(open) => {
              if (!open) {
                setIsAddDialogOpen(false)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Expense Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Vercel Pro, Office Rent"
                    value={newExpense.name}
                    onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-gray-300">
                    Project
                  </Label>
                  <Input
                    id="project"
                    placeholder="e.g., Portfolio Website"
                    value={newExpense.project}
                    onChange={(e) => setNewExpense({ ...newExpense, project: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">
                    Category
                  </Label>
                  <Input
                    id="category"
                    placeholder="e.g., Hosting, Design, Office, Tools"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-gray-300">
                      Cost (AED)
                    </Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="500"
                      value={newExpense.cost}
                      onChange={(e) => setNewExpense({ ...newExpense, cost: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing" className="text-gray-300">
                      Billing
                    </Label>
                    <Select
                      value={newExpense.billing}
                      onValueChange={(value: "monthly" | "yearly") => setNewExpense({ ...newExpense, billing: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="monthly" className="text-white hover:bg-gray-700">
                          Monthly
                        </SelectItem>
                        <SelectItem value="yearly" className="text-white hover:bg-gray-700">
                          Yearly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                    disabled={submitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingExpense ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      <>{editingExpense ? "Update" : "Add"} Expense</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={submitting}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-purple-800 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Monthly Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-purple-100">AED {totalMonthlyCost.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border-purple-800 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Yearly Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-purple-100">AED {totalYearlyCost.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="border-purple-800 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-purple-100">
                AED {filteredExpenses.reduce((total, exp) => total + exp.cost, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-800 bg-gradient-to-br from-purple-900/50 to-purple-800/30 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Active Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-purple-100">{filteredExpenses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">
                    All Projects
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project} className="text-white hover:bg-gray-700">
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 bg-gray-800/70">
                    <TableHead className="font-medium text-purple-300">Service</TableHead>
                    <TableHead className="font-medium text-purple-300">Project</TableHead>
                    <TableHead className="font-medium text-purple-300">Category</TableHead>
                    <TableHead className="font-medium text-purple-300">Cost</TableHead>
                    <TableHead className="font-medium text-purple-300">Billing</TableHead>
                    <TableHead className="font-medium text-purple-300">Monthly</TableHead>
                    <TableHead className="font-medium text-purple-300 w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell className="font-medium text-white">{expense.name}</TableCell>
                      <TableCell className="text-gray-300">{expense.project}</TableCell>
                      <TableCell className="text-gray-300">{expense.category}</TableCell>
                      <TableCell className="text-white">AED {expense.cost}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            expense.billing === "monthly"
                              ? "bg-purple-900/50 text-purple-300 border border-purple-700"
                              : "bg-gray-900 text-white border border-gray-600"
                          }`}
                        >
                          {expense.billing}
                        </span>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        AED {(expense.billing === "yearly" ? expense.cost / 12 : expense.cost).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                            className="h-8 w-8 p-0 hover:bg-purple-800/30 hover:text-purple-300 text-gray-400"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="h-8 w-8 p-0 hover:bg-red-900/30 hover:text-red-400 text-gray-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredExpenses.length === 0 && !loading && (
              <div className="text-center py-12 text-purple-400">
                <p>No expenses found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
