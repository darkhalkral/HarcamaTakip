import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container">
      <h2>Ekstre Yükle</h2>
      
      <div class="upload-form">
        <div class="form-group">
          <label for="bank">Banka Seçin:</label>
          <select id="bank" [(ngModel)]="selectedBank" class="form-control">
            <option value="">Banka seçin...</option>
            <option value="isbank">İş Bankası</option>
            <option value="garanti">Garanti Bankası</option>
            <option value="ziraat">Ziraat Bankası</option>
          </select>
        </div>

        <div class="form-group">
          <label for="pdf">PDF Dosyası:</label>
          <input 
            type="file" 
            id="pdf" 
            accept=".pdf" 
            (change)="onFileSelected($event)"
            class="form-control">
        </div>

        <button 
          (click)="uploadFile()" 
          [disabled]="!selectedFile || !selectedBank || uploading"
          class="btn btn-primary">
          {{ uploading ? 'Yükleniyor...' : 'Yükle ve İşle' }}
        </button>
      </div>

      <div *ngIf="message" class="message" [class.error]="isError">
        {{ message }}
      </div>

      <div *ngIf="uploadResult" class="result">
        <h3>Yükleme Başarılı!</h3>
        <p>{{ uploadResult.message }}</p>
        <p>{{ uploadResult.transactions?.length }} işlem veritabanına kaydedildi.</p>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .form-control {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .message {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .result {
      margin-top: 20px;
      padding: 15px;
      background-color: #d1ecf1;
      border: 1px solid #bee5eb;
      border-radius: 4px;
    }
  `]
})
export class UploadComponent {
  selectedFile: File | null = null;
  selectedBank: string = '';
  uploading: boolean = false;
  message: string = '';
  isError: boolean = false;
  uploadResult: any = null;

  constructor(private expenseService: ExpenseService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.message = '';
    this.uploadResult = null;
  }

  uploadFile() {
    if (!this.selectedFile || !this.selectedBank) {
      this.showMessage('Lütfen dosya ve banka seçin', true);
      return;
    }

    this.uploading = true;
    this.message = '';
    this.uploadResult = null;

    this.expenseService.uploadPdf(this.selectedFile, this.selectedBank).subscribe({
      next: (result) => {
        this.uploading = false;
        this.uploadResult = result;
        this.showMessage('Dosya başarıyla yüklendi ve işlendi!', false);
        this.resetForm();
      },
      error: (error) => {
        this.uploading = false;
        this.showMessage('Yükleme hatası: ' + (error.error?.error || error.message), true);
      }
    });
  }

  private showMessage(msg: string, isError: boolean) {
    this.message = msg;
    this.isError = isError;
  }

  private resetForm() {
    this.selectedFile = null;
    this.selectedBank = '';
    const fileInput = document.getElementById('pdf') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}