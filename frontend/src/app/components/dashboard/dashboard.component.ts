import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { MonthlySummary } from '../../models/expense.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <h2>Dashboard</h2>
      
      <div class="month-selector">
        <label for="monthSelect">Ay Seçin:</label>
        <select id="monthSelect" [(ngModel)]="selectedMonth" (change)="loadSummary()" class="form-control">
          <option value="">Ay seçin...</option>
          <option *ngFor="let month of availableMonths" [value]="month">{{ formatMonth(month) }}</option>
        </select>
      </div>

      <div *ngIf="!selectedMonth" class="no-selection">
        Bir ay seçin ve o aya ait kategori özetini görün.
      </div>

      <div *ngIf="selectedMonth && summary" class="summary-container">
        <h3>{{ formatMonth(selectedMonth) }} - Kategori Özeti</h3>
        
        <div class="total-amount">
          <strong>Toplam Harcama: {{ getTotalAmount() | currency:'TRY':'symbol':'1.2-2' }}</strong>
        </div>

        <div class="categories-grid">
          <div *ngFor="let item of getSummaryItems()" class="category-card">
            <div class="category-header" [style.background-color]="item.color || '#ccc'">
              <h4>{{ item.categoryName }}</h4>
            </div>
            <div class="category-body">
              <div class="amount">{{ item.total | currency:'TRY':'symbol':'1.2-2' }}</div>
              <div class="count">{{ item.count }} işlem</div>
              <div class="percentage">{{ getPercentage(item.total) }}%</div>
            </div>
          </div>
        </div>

        <div class="chart-placeholder">
          <h4>Grafik (Chart.js entegrasyonu yapılacak)</h4>
          <div class="simple-chart">
            <div *ngFor="let item of getSummaryItems()" class="chart-bar">
              <div class="bar-label">{{ item.categoryName }}</div>
              <div class="bar-container">
                <div class="bar" 
                     [style.width.%]="getPercentage(item.total)"
                     [style.background-color]="item.color || '#ccc'">
                </div>
              </div>
              <div class="bar-value">{{ item.total | currency:'TRY':'symbol':'1.0-0' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 20px auto;
      padding: 20px;
    }

    .month-selector {
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

    .no-selection {
      text-align: center;
      padding: 40px;
      color: #666;
      font-style: italic;
    }

    .summary-container {
      margin-top: 20px;
    }

    .total-amount {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      font-size: 18px;
    }

    .categories-grid {
      display: grid;
      gap: 15px;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      margin-bottom: 30px;
    }

    .category-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .category-header {
      padding: 15px;
      color: white;
      text-align: center;
    }

    .category-header h4 {
      margin: 0;
      font-size: 16px;
    }

    .category-body {
      padding: 15px;
      text-align: center;
    }

    .amount {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .count {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .percentage {
      color: #888;
      font-size: 12px;
    }

    .chart-placeholder {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .simple-chart {
      margin-top: 15px;
    }

    .chart-bar {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      gap: 10px;
    }

    .bar-label {
      min-width: 100px;
      font-size: 12px;
      font-weight: bold;
    }

    .bar-container {
      flex: 1;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      border-radius: 10px;
      min-width: 2px;
    }

    .bar-value {
      min-width: 80px;
      text-align: right;
      font-size: 12px;
      font-weight: bold;
    }
  `]
})
export class DashboardComponent implements OnInit {
  selectedMonth: string = '';
  summary: MonthlySummary | null = null;
  availableMonths: string[] = [];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.loadAvailableMonths();
  }

  loadAvailableMonths() {
    // Get all expenses to extract available months
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        const months = [...new Set(expenses.map(expense => expense.month))];
        this.availableMonths = months.sort().reverse();
      },
      error: (error) => {
        console.error('Failed to load months:', error);
      }
    });
  }

  loadSummary() {
    if (!this.selectedMonth) {
      this.summary = null;
      return;
    }

    this.expenseService.getMonthlySummary(this.selectedMonth).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (error) => {
        console.error('Failed to load summary:', error);
      }
    });
  }

  getSummaryItems() {
    if (!this.summary) return [];
    
    return Object.entries(this.summary).map(([categoryName, data]) => ({
      categoryName,
      ...data
    })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }

  getTotalAmount(): number {
    if (!this.summary) return 0;
    
    return Object.values(this.summary).reduce((total, item) => total + item.total, 0);
  }

  getPercentage(amount: number): number {
    const total = Math.abs(this.getTotalAmount());
    if (total === 0) return 0;
    return Math.round((Math.abs(amount) / total) * 100);
  }

  formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  }
}