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
      gap: 15px;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }

    .expense-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .date {
      font-weight: bold;
      color: #666;
    }

    .amount {
      font-size: 18px;
      font-weight: bold;
      color: #28a745;
    }

    .amount.negative {
      color: #dc3545;
    }

    .expense-description {
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }

    .expense-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }

    .bank {
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }

    .category-selector {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .category-select {
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 12px;
    }

    .category-badge {
      padding: 4px 8px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      font-size: 11px;
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

  private extractAvailableMonths() {
    const months = [...new Set(this.expenses.map(expense => expense.month))];
    this.availableMonths = months.sort().reverse();
  }
}