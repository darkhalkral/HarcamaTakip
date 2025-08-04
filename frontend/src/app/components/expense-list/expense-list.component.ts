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
        <label for="monthFilter">Ay Filtresi:</label>
        <select id="monthFilter" [(ngModel)]="selectedMonth" (change)="onMonthChange()" class="form-control">
          <option value="">Tüm aylar</option>
          <option *ngFor="let month of availableMonths" [value]="month">{{ formatMonth(month) }}</option>
        </select>
      </div>

      <div *ngIf="expenses.length === 0" class="no-data">
        Henüz harcama kaydı bulunmuyor.
      </div>

      <div *ngIf="expenses.length > 0" class="expenses-grid">
        <div *ngFor="let expense of expenses" class="expense-card">
          <div class="expense-header">
            <span class="date">{{ expense.date }}</span>
            <span class="amount" [class.negative]="expense.amount < 0">
              {{ expense.amount | currency:'TRY':'symbol':'1.2-2' }}
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
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
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
  categories: Category[] = [];
  selectedMonth: string = '';
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
        this.expenses = expenses;
        this.extractAvailableMonths();
      },
      error: (error) => {
        console.error('Failed to load expenses:', error);
      }
    });
  }

  onMonthChange() {
    if (this.selectedMonth) {
      this.expenseService.getExpensesByMonth(this.selectedMonth).subscribe({
        next: (expenses) => {
          this.expenses = expenses;
        },
        error: (error) => {
          console.error('Failed to load monthly expenses:', error);
        }
      });
    } else {
      this.loadExpenses();
    }
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

  private extractAvailableMonths() {
    const months = [...new Set(this.expenses.map(expense => expense.month))];
    this.availableMonths = months.sort().reverse();
  }
}