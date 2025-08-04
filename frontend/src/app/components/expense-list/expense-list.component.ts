import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { Expense, Category } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-list-container">
      <h2>Harcamalar</h2>
      
      <div class="filters">
        <div class="filter-group">
          <label for="monthFilter">Ay Filtresi:</label>
          <select id="monthFilter" [(ngModel)]="selectedMonth" (change)="onMonthChange()" class="form-control">
            <option value="">Tüm aylar</option>
            <option *ngFor="let month of availableMonths" [value]="month">{{ formatMonth(month) }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="categoryFilter">Kategori Filtresi:</label>
          <select id="categoryFilter" [(ngModel)]="selectedCategoryFilter" (change)="onCategoryFilterChange()" class="form-control">
            <option value="">Tüm kategoriler</option>
            <option value="categorized">Kategorili işlemler</option>
            <option value="uncategorized">Kategorisiz işlemler</option>
            <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
          </select>
        </div>
        
        <div class="stats">
          <span class="stat-item categorized">
            <span class="stat-dot categorized"></span>
            Kategorili: {{ getCategorizedCount() }}
          </span>
          <span class="stat-item uncategorized">
            <span class="stat-dot uncategorized"></span>
            Kategorisiz: {{ getUncategorizedCount() }}
          </span>
        </div>
      </div>

      <div *ngIf="expenses.length === 0" class="no-data">
        Henüz harcama kaydı bulunmuyor.
      </div>

      <div *ngIf="expenses.length > 0" class="expenses-grid">
        <div *ngFor="let expense of expenses" 
             class="expense-card" 
             [class.categorized]="expense.categoryId" 
             [class.uncategorized]="!expense.categoryId">
          <div class="expense-header">
            <span class="date">{{ expense.date }}</span>
            <span class="amount" [class.negative]="expense.amount < 0">
              {{ expense.amount | currency:'TRY':'symbol':'1.2-2' }}
            </span>
            <span class="category-status" [class.has-category]="expense.categoryId">
              {{ expense.categoryId ? '✅' : '⚠️' }}
            </span>
          </div>
          
          <div class="expense-description">
            {{ expense.description }}
          </div>
          
          <div class="expense-details">
            <span class="bank">{{ getBankName(expense.bank) }}</span>
            <div class="category-selector">
              <select 
                [(ngModel)]="expense.categoryId" 
                (change)="updateCategory(expense)"
                class="category-select">
                <option [value]="null">Kategori seçin...</option>
                <option *ngFor="let category of categories" [value]="category.id">
                  {{ category.name }}
                </option>
              </select>
              <span *ngIf="expense.category" 
                    class="category-badge" 
                    [style.background-color]="expense.category.color">
                {{ expense.category.name }}
              </span>
            </div>
            <button class="delete-btn" (click)="deleteExpense(expense)" title="Sil">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-list-container {
      max-width: 1200px;
      margin: 20px auto;
      padding: 20px;
    }

    .filters {
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .filter-group label {
      font-weight: 600;
      color: #495057;
      font-size: 14px;
    }

    .stats {
      display: flex;
      gap: 20px;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #dee2e6;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .stat-item.categorized {
      color: #28a745;
    }

    .stat-item.uncategorized {
      color: #dc3545;
    }

    .stat-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .stat-dot.categorized {
      background: linear-gradient(135deg, #28a745, #20c997);
    }

    .stat-dot.uncategorized {
      background: linear-gradient(135deg, #dc3545, #fd7e14);
    }

    .form-control {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      min-width: 200px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }

    .expenses-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    }

    .expense-card {
      border: none;
      border-radius: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border-left: 4px solid #007bff;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .expense-card.categorized {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border-left: 4px solid #28a745;
      box-shadow: 0 8px 32px rgba(40, 167, 69, 0.15);
    }

    .expense-card.uncategorized {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
      border-left: 4px solid #dc3545;
      box-shadow: 0 8px 32px rgba(220, 53, 69, 0.15);
      animation: pulse-warning 2s infinite;
    }

    @keyframes pulse-warning {
      0% { box-shadow: 0 8px 32px rgba(220, 53, 69, 0.15); }
      50% { box-shadow: 0 8px 32px rgba(220, 53, 69, 0.25); }
      100% { box-shadow: 0 8px 32px rgba(220, 53, 69, 0.15); }
    }

    .expense-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #007bff, #28a745, #ffc107, #dc3545);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .expense-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0,0,0,0.12);
    }

    .expense-card:hover::before {
      opacity: 1;
    }

    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .category-status {
      font-size: 18px;
      margin-left: 8px;
    }

    .category-status.has-category {
      filter: drop-shadow(0 2px 4px rgba(40, 167, 69, 0.3));
    }

    .date {
      font-weight: 600;
      color: #6c757d;
      font-size: 14px;
      background: rgba(108, 117, 125, 0.1);
      padding: 4px 12px;
      border-radius: 20px;
    }

    .amount {
      font-size: 20px;
      font-weight: 700;
      color: #28a745;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .amount.negative {
      color: #dc3545;
    }

    .expense-description {
      margin-bottom: 16px;
      color: #2c3e50;
      font-size: 15px;
      font-weight: 500;
      line-height: 1.4;
      letter-spacing: 0.2px;
    }

    .expense-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      gap: 12px;
    }

    .bank {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .category-selector {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      justify-content: flex-end;
    }

    .category-select {
      padding: 6px 12px;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 12px;
      background: white;
      transition: all 0.2s ease;
      min-width: 140px;
    }

    .category-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .category-badge {
      padding: 6px 12px;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .delete-btn {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      border: none;
      font-size: 14px;
      cursor: pointer;
      padding: 8px 10px;
      border-radius: 12px;
      transition: all 0.3s ease;
      color: white;
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delete-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4);
      background: linear-gradient(135deg, #ff5252 0%, #e53935 100%);
    }

    .delete-btn:active {
      transform: translateY(0);
    }
  `]
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  allExpenses: Expense[] = []; // Tüm expenses'i sakla
  categories: Category[] = [];
  selectedMonth: string = '';
  selectedCategoryFilter: string = '';
  availableMonths: string[] = [];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadExpenses();
  }

  loadCategories() {
    this.expenseService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  loadExpenses() {
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.allExpenses = expenses;
        this.expenses = expenses;
        this.extractAvailableMonths();
      },
      error: (error) => {
        console.error('Failed to load expenses:', error);
      }
    });
  }

  onMonthChange() {
    this.applyFilters();
  }

  onCategoryFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filteredExpenses = [...this.allExpenses];

    // Ay filtresi
    if (this.selectedMonth) {
      filteredExpenses = filteredExpenses.filter(expense => expense.month === this.selectedMonth);
    }

    // Kategori filtresi
    if (this.selectedCategoryFilter) {
      if (this.selectedCategoryFilter === 'categorized') {
        filteredExpenses = filteredExpenses.filter(expense => expense.categoryId !== null);
      } else if (this.selectedCategoryFilter === 'uncategorized') {
        filteredExpenses = filteredExpenses.filter(expense => expense.categoryId === null);
      } else {
        // Specific category ID
        const categoryId = parseInt(this.selectedCategoryFilter);
        filteredExpenses = filteredExpenses.filter(expense => expense.categoryId === categoryId);
      }
    }

    this.expenses = filteredExpenses;
  }

  updateCategory(expense: Expense) {
    this.expenseService.updateExpenseCategory(expense.id, expense.categoryId || null).subscribe({
      next: (updatedExpense) => {
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index !== -1) {
          this.expenses[index] = updatedExpense;
        }
      },
      error: (error) => {
        console.error('Failed to update category:', error);
      }
    });
  }

  getBankName(bank: string): string {
    const bankNames: { [key: string]: string } = {
      'isbank': 'İş Bankası',
      'garanti': 'Garanti',
      'ziraat': 'Ziraat'
    };
    return bankNames[bank] || bank;
  }

  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  }

  deleteExpense(expense: Expense) {
    if (confirm(`"${expense.description}" harcamasını silmek istediğinizden emin misiniz?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.extractAvailableMonths();
        },
        error: (error) => {
          console.error('Failed to delete expense:', error);
          alert('Harcama silinirken bir hata oluştu.');
        }
      });
    }
  }

  getCategorizedCount(): number {
    return this.expenses.filter(expense => expense.categoryId !== null).length;
  }

  getUncategorizedCount(): number {
    return this.expenses.filter(expense => expense.categoryId === null).length;
  }

  private extractAvailableMonths() {
    const months = [...new Set(this.allExpenses.map(expense => expense.month))];
    this.availableMonths = months.sort().reverse();
  }
}