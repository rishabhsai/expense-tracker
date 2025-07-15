"use client"

import { useState, useMemo } from "react"
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Upload,
  ChevronsUpDown,
  Check,
  Info,
} from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExpenses } from "@/hooks/use-expenses"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ExpenseTracker() {
  const { expenses, loading, error, addExpense, updateExpense, deleteExpense } = useExpenses()

  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false)
  const [isProjectPopoverOpen, setIsProjectPopoverOpen] = useState(false)

  const [newExpense, setNewExpense] = useState({
    name: "",
    project: "",
    cost: "0",
    billing: "one-time" as "monthly" | "yearly" | "one-time",
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
      if (exp.billing === "one-time") {
        return total
      }
      const monthlyCost = exp.billing === "yearly" ? exp.cost / 12 : exp.cost
      return total + monthlyCost
    }, 0)
  }, [filteredExpenses])

  const totalYearlyCost = totalMonthlyCost * 12

  const totalOneTimeCost = useMemo(() => {
    return filteredExpenses
      .filter((exp) => exp.billing === "one-time")
      .reduce((total, exp) => total + exp.cost, 0)
  }, [filteredExpenses])

  const totalCost = totalMonthlyCost + totalOneTimeCost

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
      resetForm()
      setIsAddDialogOpen(false)
    }
    setSubmitting(false)
  }

  const handleEditClick = (expense: any) => {
    setEditingExpense(expense)
    setNewExpense({
      name: expense.name,
      project: expense.project,
      cost: expense.cost.toString(),
      billing: expense.billing,
      category: expense.category,
    })
    setIsAddDialogOpen(true)
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
      resetForm()
      setIsAddDialogOpen(false)
    }
    setSubmitting(false)
  }

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id)
  }

  const resetForm = () => {
    setNewExpense({ name: "", project: "", cost: "0", billing: "one-time", category: "" })
    setEditingExpense(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount)
  }

  const handleExportCSV = () => {
    const headers = ["Service", "Project", "Category", "Cost (AED)", "Billing", "Monthly Cost (AED)"]
    const csvRows = [headers.join(",")]

    filteredExpenses.forEach((expense) => {
      const monthlyCost =
        expense.billing === "one-time"
          ? "N/A"
          : (expense.billing === "yearly" ? expense.cost / 12 : expense.cost).toFixed(2)

      const row = [
        `"${expense.name}"`,
        `"${expense.project}"`,
        `"${expense.category}"`,
        expense.cost,
        expense.billing,
        monthlyCost,
      ]
      csvRows.push(row.join(","))
    })

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "expenses.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    autoTable(doc, {
      head: [["Service", "Project", "Category", "Cost", "Billing", "Monthly"]],
      body: filteredExpenses.map((exp) => [
        exp.name,
        exp.project,
        exp.category,
        formatCurrency(exp.cost),
        exp.billing,
        exp.billing === "one-time"
          ? "—"
          : formatCurrency(exp.billing === "yearly" ? exp.cost / 12 : exp.cost),
      ]),
      startY: 20,
      didDrawPage: function (data) {
        doc.setFontSize(20)
        doc.setTextColor(40)
        doc.text("Expenses Report", data.settings.margin.left || 15, 15)
      },
    })
    doc.save("expenses.pdf")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading expenses...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track your project expenses & subscriptions.</p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>Export as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (!open) {
                  resetForm()
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                  <DialogDescription>
                    {editingExpense ? "Update the details of your expense." : "Enter the details of your new expense."}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    editingExpense ? handleUpdateExpense() : handleAddExpense()
                  }}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Expense Name</Label>
                    <Input
                      id="name"
                      placeholder="Name of expense"
                      value={newExpense.name}
                      onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="project">Project</Label>
                      <Popover open={isProjectPopoverOpen} onOpenChange={setIsProjectPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isProjectPopoverOpen}
                            className="w-full justify-between"
                          >
                            {newExpense.project || "Select a project..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search or create project..."
                              value={newExpense.project}
                              onValueChange={(search) => setNewExpense({ ...newExpense, project: search })}
                            />
                            <CommandList>
                              <CommandEmpty>No project found.</CommandEmpty>
                              <CommandGroup>
                                {projects.map((project) => (
                                  <CommandItem
                                    key={project}
                                    value={project}
                                    onSelect={(currentValue) => {
                                      setNewExpense({
                                        ...newExpense,
                                        project: currentValue === newExpense.project ? "" : currentValue,
                                      })
                                      setIsProjectPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newExpense.project === project ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {project}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCategoryPopoverOpen}
                            className="w-full justify-between"
                          >
                            {newExpense.category || "Select a category..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search or create category..."
                              value={newExpense.category}
                              onValueChange={(search) => setNewExpense({ ...newExpense, category: search })}
                            />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category}
                                    value={category}
                                    onSelect={(currentValue) => {
                                      setNewExpense({
                                        ...newExpense,
                                        category: currentValue === newExpense.category ? "" : currentValue,
                                      })
                                      setIsCategoryPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        newExpense.category === category ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {category}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost (AED)</Label>
                      <Input
                        id="cost"
                        type="number"
                        placeholder="500"
                        value={newExpense.cost}
                        onChange={(e) => setNewExpense({ ...newExpense, cost: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing">Billing</Label>
                      <Select
                        value={newExpense.billing}
                        onValueChange={(value: "monthly" | "yearly" | "one-time") =>
                          setNewExpense({ ...newExpense, billing: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingExpense ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>{editingExpense ? "Update Expense" : "Add Expense"}</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardContent className="flex h-full flex-col items-center justify-center p-4">
              <p className="text-base font-semibold">Rishabh & Fateen</p>
              <div className="mt-2 space-y-1 text-center text-sm text-muted-foreground">
                <p>1000dates.co</p>
                <p>briefli.io</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  Total Cost
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-center">
                        <p>Yearly cost, calculating the recurring monthly expenses: {formatCurrency(totalYearlyCost)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredExpenses.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj} value={proj}>
                    {proj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expenses Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.project}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.cost)}</TableCell>
                    <TableCell>
                      <Badge variant={expense.billing === "yearly" ? "secondary" : "outline"}>
                        {expense.billing}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {expense.billing === "one-time"
                        ? "—"
                        : formatCurrency(expense.billing === "yearly" ? expense.cost / 12 : expense.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No expenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
