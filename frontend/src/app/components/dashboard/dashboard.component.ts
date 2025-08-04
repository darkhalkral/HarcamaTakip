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
      <!-- Header Section -->
      <div class="dashboard-header">
        <h1 class="dashboard-title">📊 Harcama Dashboard</h1>
        <p class="dashboard-subtitle">Harcamalarınızı analiz edin ve kontrol altında tutun</p>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle-card">
        <div class="toggle-buttons">
          <button 
            class="toggle-btn" 
            [class.active]="showYearlyView" 
            (click)="showYearlyView = true">
            📊 Yıllık Özet
          </button>
          <button 
            class="toggle-btn" 
            [class.active]="!showYearlyView" 
            (click)="showYearlyView = false">
            📅 Aylık Detay
          </button>
        </div>
      </div>

      <!-- Month Selector (only show when not in yearly view) -->
      <div *ngIf="!showYearlyView" class="month-selector-card">
        <div class="selector-content">
          <label for="monthSelect" class="selector-label">📅 Dönem Seçimi</label>
          <select id="monthSelect" [(ngModel)]="selectedMonth" (change)="loadSummary()" class="month-select">
            <option value="">Bir ay seçin...</option>
            <option *ngFor="let month of availableMonths" [value]="month">{{ formatMonth(month) }}</option>
          </select>
        </div>
      </div>

      <!-- Yearly Overview -->
      <div *ngIf="showYearlyView && yearlySummary" class="yearly-overview">
        
        <!-- Grand Total Stats -->
        <div class="grand-stats-section">
          <h2 class="section-title">🏆 Genel Özet (Tüm Zamanlar)</h2>
          <div class="grand-stats-grid">
            <div class="grand-stat-card total-spent">
              <div class="grand-stat-icon">💰</div>
              <div class="grand-stat-content">
                <div class="grand-stat-label">Toplam Harcama</div>
                <div class="grand-stat-value">{{ formatCurrency(yearlySummary.grandTotal) }}</div>
              </div>
            </div>
            
            <div class="grand-stat-card total-transactions">
              <div class="grand-stat-icon">🧾</div>
              <div class="grand-stat-content">
                <div class="grand-stat-label">Toplam İşlem</div>
                <div class="grand-stat-value">{{ yearlySummary.totalTransactions }}</div>
              </div>
            </div>
            
            <div class="grand-stat-card active-years">
              <div class="grand-stat-icon">📅</div>
              <div class="grand-stat-content">
                <div class="grand-stat-label">Aktif Yıl</div>
                <div class="grand-stat-value">{{ yearlySummary.availableYears?.length || 0 }}</div>
              </div>
            </div>
            
            <div class="grand-stat-card avg-monthly">
              <div class="grand-stat-icon">📈</div>
              <div class="grand-stat-content">
                <div class="grand-stat-label">Aylık Ortalama</div>
                <div class="grand-stat-value">{{ formatCurrency(getMonthlyAverage()) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- All Categories Summary -->
        <div class="all-categories-section">
          <h3 class="section-title">🎯 Kategori Bazında Toplam Harcamalar</h3>
          <div class="all-categories-grid">
            <div *ngFor="let item of getAllCategoriesSorted(); let i = index" 
                 class="all-category-card" 
                 [class.top-category]="i === 0">
              <div class="all-card-header">
                <div class="all-category-icon">{{ getCategoryIcon(item.categoryName) }}</div>
                <h4 class="all-category-name">{{ item.categoryName }}</h4>
                <div class="all-category-rank" *ngIf="i === 0">👑</div>
              </div>
              <div class="all-category-stats">
                <div class="all-primary-stat">{{ formatCurrency(item.total) }}</div>
                <div class="all-secondary-stats">
                  <span class="all-transaction-count">{{ item.count }} işlem</span>
                  <span class="all-percentage-badge">%{{ getCategoryPercentage(item.total) }}</span>
                </div>
              </div>
              <div class="all-progress-bar">
                <div class="all-progress-fill" 
                     [style.width.%]="getCategoryPercentage(item.total)"
                     [style.background]="getCategoryGradient(item.categoryName)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Year by Year Breakdown -->
        <div *ngIf="yearlySummary.availableYears?.length > 1" class="yearly-breakdown-section">
          <h3 class="section-title">📊 Yıllık Karşılaştırma</h3>
          <div class="yearly-comparison">
            <div *ngFor="let year of yearlySummary.availableYears" class="year-card">
              <div class="year-header">
                <h4>{{ year }}</h4>
                <div class="year-total">{{ formatCurrency(getYearTotal(year)) }}</div>
              </div>
              <div class="year-categories">
                <div *ngFor="let category of getTopCategoriesForYear(year)" class="year-category-item">
                  <span class="year-cat-icon">{{ getCategoryIcon(category.name) }}</span>
                  <span class="year-cat-name">{{ category.name }}</span>
                  <span class="year-cat-amount">{{ formatCurrency(category.total) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Welcome State for Monthly View -->
      <div *ngIf="!showYearlyView && !selectedMonth" class="welcome-state">
        <div class="welcome-icon">🎯</div>
        <h3>Aylık Detay Görünümü</h3>
        <p>Yukarıdan bir ay seçerek o aya ait detaylı harcama analizinizi görüntüleyebilirsiniz.</p>
      </div>

      <!-- Monthly Dashboard Content -->
      <div *ngIf="!showYearlyView && selectedMonth && summary" class="dashboard-content">
        
        <!-- Stats Cards Row -->
        <div class="stats-row">
          <div class="stat-card total-card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-label">Toplam Harcama</div>
              <div class="stat-value">{{ formatCurrency(getTotalAmount()) }}</div>
            </div>
          </div>
          
          <div class="stat-card transactions-card">
            <div class="stat-icon">🧾</div>
            <div class="stat-content">
              <div class="stat-label">Toplam İşlem</div>
              <div class="stat-value">{{ getTotalTransactions() }}</div>
            </div>
          </div>
          
          <div class="stat-card categories-card">
            <div class="stat-icon">🏷️</div>
            <div class="stat-content">
              <div class="stat-label">Aktif Kategori</div>
              <div class="stat-value">{{ getActiveCategories() }}</div>
            </div>
          </div>
          
          <div class="stat-card average-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-label">Ortalama İşlem</div>
              <div class="stat-value">{{ formatCurrency(getAverageTransaction()) }}</div>
            </div>
          </div>
        </div>

        <!-- Period Title -->
        <div class="period-title">
          <h2>{{ formatMonth(selectedMonth) }} Dönemi Analizi</h2>
        </div>

        <!-- Categories Grid -->
        <div class="categories-section">
          <h3 class="section-title">💳 Kategori Dağılımı</h3>
          <div class="categories-grid">
            <div *ngFor="let item of getSummaryItems(); let i = index" 
                 class="category-card" 
                 [class.top-category]="i === 0">
              <div class="card-header">
                <div class="category-icon">{{ getCategoryIcon(item.categoryName) }}</div>
                <h4 class="category-name">{{ item.categoryName }}</h4>
                <div class="category-rank" *ngIf="i === 0">#1</div>
              </div>
              <div class="category-stats">
                <div class="primary-stat">{{ formatCurrency(item.total) }}</div>
                <div class="secondary-stats">
                  <span class="transaction-count">{{ item.count }} işlem</span>
                  <span class="percentage-badge">%{{ getPercentage(item.total) }}</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" 
                     [style.width.%]="getPercentage(item.total)"
                     [style.background]="getCategoryGradient(item.categoryName)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Chart Section -->
        <div class="chart-section">
          <h3 class="section-title">📊 Harcama Dağılım Grafiği</h3>
          <div class="chart-container">
            <div class="chart-bars">
              <div *ngFor="let item of getSummaryItems()" class="chart-bar-row">
                <div class="bar-info">
                  <span class="bar-category">{{ getCategoryIcon(item.categoryName) }} {{ item.categoryName }}</span>
                  <span class="bar-amount">{{ formatCurrency(item.total) }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" 
                       [style.width.%]="getPercentage(item.total)"
                       [style.background]="getCategoryGradient(item.categoryName)">
                    <span class="bar-percentage">%{{ getPercentage(item.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Insights Section -->
        <div class="insights-section">
          <h3 class="section-title">💡 Akıllı İncelemeler</h3>
          <div class="insights-grid">
            <div class="insight-card">
              <div class="insight-icon">🏆</div>
              <div class="insight-content">
                <h4>En Çok Harcama</h4>
                <p>{{ getTopCategory() }} kategorisinde en çok harcama yaptınız</p>
              </div>
            </div>
            <div class="insight-card">
              <div class="insight-icon">⚡</div>
              <div class="insight-content">
                <h4>En Aktif Kategori</h4>
                <p>{{ getMostActiveCategory() }} kategorisinde en çok işlem gerçekleştirdiniz</p>
              </div>
            </div>
            <div class="insight-card">
              <div class="insight-icon">📱</div>
              <div class="insight-content">
                <h4>İşlem Sıklığı</h4>
                <p>Günde ortalama {{ getDailyTransactionCount() }} işlem yapıyorsunuz</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    /* Header Section */
    .dashboard-header {
      text-align: center;
      margin-bottom: 32px;
      padding: 32px 0;
    }

    .dashboard-title {
      font-size: 2.2rem;
      font-weight: 700;
      background: linear-gradient(45deg, #fff, #f8f9fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dashboard-subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 1rem;
      margin: 0;
      font-weight: 400;
    }

    /* Month Selector */
    .month-selector-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .selector-content {
      display: flex;
      align-items: center;
      gap: 16px;
      justify-content: center;
    }

    .selector-label {
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .month-select {
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      background: white;
      font-size: 1rem;
      font-weight: 500;
      min-width: 200px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .month-select:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
    }

    /* Welcome State */
    .welcome-state {
      text-align: center;
      padding: 80px 40px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      color: white;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .welcome-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .welcome-state h3 {
      font-size: 2rem;
      margin: 0 0 16px 0;
      font-weight: 600;
    }

    .welcome-state p {
      font-size: 1.1rem;
      opacity: 0.9;
      max-width: 500px;
      margin: 0 auto;
    }

    /* Dashboard Content */
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: rgba(255,255,255,0.95);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: linear-gradient(45deg, #667eea, #764ba2);
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .stat-value {
      color: #333;
      font-size: 1.8rem;
      font-weight: 700;
    }

    /* Period Title */
    .period-title {
      text-align: center;
      margin: 16px 0;
    }

    .period-title h2 {
      color: white;
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
    }

    /* Section Titles */
    .section-title {
      color: white;
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0 0 20px 0;
      text-align: center;
    }

    /* Categories Section */
    .categories-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 32px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .category-card {
      background: rgba(255,255,255,0.95);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.2);
      position: relative;
      overflow: hidden;
    }

    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    .category-card.top-category {
      border: 2px solid #ffd700;
      box-shadow: 0 8px 32px rgba(255,215,0,0.3);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
    }

    .category-icon {
      font-size: 1.8rem;
    }

    .category-name {
      flex: 1;
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .category-rank {
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      color: #333;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .category-stats {
      margin-bottom: 16px;
    }

    .primary-stat {
      font-size: 1.8rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }

    .secondary-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .transaction-count {
      color: #666;
      font-size: 0.9rem;
    }

    .percentage-badge {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* Chart Section */
    .chart-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 32px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .chart-container {
      background: rgba(255,255,255,0.95);
      border-radius: 16px;
      padding: 24px;
    }

    .chart-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chart-bar-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bar-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .bar-category {
      font-weight: 600;
      color: #333;
    }

    .bar-amount {
      font-weight: 700;
      color: #667eea;
    }

    .bar-track {
      height: 24px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      border-radius: 12px;
      transition: width 0.8s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 12px;
      min-width: 60px;
    }

    .bar-percentage {
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    /* Insights Section */
    .insights-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 32px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .insight-card {
      background: rgba(255,255,255,0.95);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      gap: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .insight-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    .insight-icon {
      font-size: 2rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      flex-shrink: 0;
    }

    .insight-content h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .insight-content p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    /* View Toggle */
    .view-toggle-card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .toggle-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .toggle-btn {
      padding: 12px 24px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .toggle-btn:hover {
      background: rgba(255,255,255,0.2);
      color: white;
      transform: translateY(-2px);
    }

    .toggle-btn.active {
      background: white;
      color: #667eea;
      border-color: white;
      box-shadow: 0 4px 12px rgba(255,255,255,0.3);
    }

    /* Yearly Overview */
    .yearly-overview {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Grand Stats Section */
    .grand-stats-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .grand-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .grand-stat-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.3);
      position: relative;
      overflow: hidden;
    }

    .grand-stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }

    .grand-stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(45deg, #667eea, #764ba2);
    }

    .grand-stat-icon {
      font-size: 1.8rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      flex-shrink: 0;
    }

    .grand-stat-content {
      flex: 1;
    }

    .grand-stat-label {
      color: #666;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .grand-stat-value {
      color: #333;
      font-size: 1.4rem;
      font-weight: 700;
      line-height: 1.2;
    }

    /* All Categories Section */
    .all-categories-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .all-categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .all-category-card {
      background: rgba(255,255,255,0.95);
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.3);
      position: relative;
    }

    .all-category-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    .all-category-card.top-category {
      border: 2px solid #ffd700;
      box-shadow: 0 4px 20px rgba(255,215,0,0.2);
    }

    .all-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .all-category-icon {
      font-size: 1.5rem;
    }

    .all-category-name {
      flex: 1;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .all-category-rank {
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      color: #333;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .all-category-stats {
      margin-bottom: 14px;
    }

    .all-primary-stat {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }

    .all-secondary-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .all-transaction-count {
      color: #666;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .all-percentage-badge {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .all-progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .all-progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease;
    }

    /* Yearly Breakdown Section */
    .yearly-breakdown-section {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .yearly-comparison {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }

    .year-card {
      background: rgba(255,255,255,0.95);
      border-radius: 12px;
      padding: 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }

    .year-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    .year-header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e9ecef;
    }

    .year-header h4 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 6px 0;
    }

    .year-total {
      font-size: 1.3rem;
      font-weight: 700;
      color: #667eea;
    }

    .year-categories {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .year-category-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      border-radius: 6px;
      background: #f8f9fa;
      transition: background 0.2s ease;
    }

    .year-category-item:hover {
      background: #e9ecef;
    }

    .year-cat-icon {
      font-size: 1rem;
    }

    .year-cat-name {
      flex: 1;
      font-weight: 500;
      color: #555;
      font-size: 0.85rem;
    }

    .year-cat-amount {
      font-weight: 600;
      color: #667eea;
      font-size: 0.85rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .stats-row {
        grid-template-columns: 1fr;
      }
      
      .categories-grid {
        grid-template-columns: 1fr;
      }
      
      .insights-grid {
        grid-template-columns: 1fr;
      }
      
      .selector-content {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  selectedMonth: string = '';
  summary: MonthlySummary | null = null;
  availableMonths: string[] = [];
  
  // Yearly data
  yearlySummary: any = null;
  showYearlyView: boolean = true;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit() {
    this.loadAvailableMonths();
    this.loadYearlySummary();
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

  loadYearlySummary() {
    this.expenseService.getYearlySummary().subscribe({
      next: (data) => {
        this.yearlySummary = data;
      },
      error: (error) => {
        console.error('Failed to load yearly summary:', error);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  }

  getTotalTransactions(): number {
    if (!this.summary) return 0;
    return Object.values(this.summary).reduce((total, item) => total + item.count, 0);
  }

  getActiveCategories(): number {
    if (!this.summary) return 0;
    return Object.keys(this.summary).length;
  }

  getAverageTransaction(): number {
    const total = Math.abs(this.getTotalAmount());
    const count = this.getTotalTransactions();
    return count > 0 ? total / count : 0;
  }

  getCategoryIcon(categoryName: string): string {
    const icons: { [key: string]: string } = {
      'Yemek': '🍕',
      'Market': '🛒',
      'Giyim': '👕',
      'Araç': '🚗',
      'Abonelik': '📱',
      'Eğlence': '🎬',
      'Elektronik': '💻',
      'Ulaşım': '🚌',
      'Diğer': '📦',
      'Faiz': '🏦'
    };
    return icons[categoryName] || '📦';
  }

  getCategoryGradient(categoryName: string): string {
    const gradients: { [key: string]: string } = {
      'Yemek': 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
      'Market': 'linear-gradient(45deg, #4ecdc4, #44a08d)',
      'Giyim': 'linear-gradient(45deg, #a55eea, #8854d0)',
      'Araç': 'linear-gradient(45deg, #fd9644, #f39c12)',
      'Abonelik': 'linear-gradient(45deg, #45b7d1, #3498db)',
      'Eğlence': 'linear-gradient(45deg, #f093fb, #f5576c)',
      'Elektronik': 'linear-gradient(45deg, #4facfe, #00f2fe)',
      'Ulaşım': 'linear-gradient(45deg, #43e97b, #38f9d7)',
      'Diğer': 'linear-gradient(45deg, #ffeaa7, #fdcb6e)',
      'Faiz': 'linear-gradient(45deg, #6c5ce7, #a29bfe)'
    };
    return gradients[categoryName] || 'linear-gradient(45deg, #667eea, #764ba2)';
  }

  getTopCategory(): string {
    if (!this.summary) return 'Yok';
    const items = this.getSummaryItems();
    return items.length > 0 ? items[0].categoryName : 'Yok';
  }

  getMostActiveCategory(): string {
    if (!this.summary) return 'Yok';
    const items = Object.entries(this.summary).map(([categoryName, data]) => ({
      categoryName,
      count: data.count
    })).sort((a, b) => b.count - a.count);
    return items.length > 0 ? items[0].categoryName : 'Yok';
  }

  getDailyTransactionCount(): string {
    if (!this.selectedMonth) return '0';
    const totalTransactions = this.getTotalTransactions();
    const daysInMonth = new Date(
      parseInt(this.selectedMonth.split('-')[0]),
      parseInt(this.selectedMonth.split('-')[1]),
      0
    ).getDate();
    const avgPerDay = totalTransactions / daysInMonth;
    return avgPerDay.toFixed(1);
  }

  // Yearly view methods
  getMonthlyAverage(): number {
    if (!this.yearlySummary || !this.availableMonths.length) return 0;
    return this.yearlySummary.grandTotal / this.availableMonths.length;
  }

  getAllCategoriesSorted(): any[] {
    if (!this.yearlySummary?.categoryTotals) return [];
    
    return Object.entries(this.yearlySummary.categoryTotals).map(([categoryName, data]: [string, any]) => ({
      categoryName,
      ...data
    })).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }

  getCategoryPercentage(amount: number): number {
    if (!this.yearlySummary) return 0;
    const total = Math.abs(this.yearlySummary.grandTotal);
    if (total === 0) return 0;
    return Math.round((Math.abs(amount) / total) * 100);
  }

  getYearTotal(year: string): number {
    if (!this.yearlySummary?.yearlyData?.[year]) return 0;
    
    return Object.values(this.yearlySummary.yearlyData[year]).reduce((sum: number, category: any) => {
      return sum + category.total;
    }, 0);
  }

  getTopCategoriesForYear(year: string): any[] {
    if (!this.yearlySummary?.yearlyData?.[year]) return [];
    
    return Object.entries(this.yearlySummary.yearlyData[year])
      .map(([name, data]: [string, any]) => ({ name, ...data }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
      .slice(0, 5); // Top 5 categories
  }
}