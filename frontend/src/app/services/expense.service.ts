import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, Category, MonthlySummary } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  uploadPdf(file: File, bank: string): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('bank', bank);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`);
  }

  getExpensesByMonth(month: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses/month/${month}`);
  }

  getMonthlySummary(month: string): Observable<MonthlySummary> {
    return this.http.get<MonthlySummary>(`${this.apiUrl}/summary/month/${month}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(name: string, color?: string): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, { name, color });
  }

  updateExpenseCategory(expenseId: number, categoryId: number | null): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${expenseId}/category`, { categoryId });
  }
}