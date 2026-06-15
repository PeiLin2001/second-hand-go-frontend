import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AnnounDialogComponent } from '../announcement-dialog/announcement-dialog.component';
import { HttpService } from '../../@Services/http.service';
import { config } from 'rxjs';

@Component({
  selector: 'app-report-dialog',
  imports: [MatDialogModule, MatButtonModule,FormsModule],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss',
})
export class ReportDialogComponent {
    constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ReportDialogComponent>,
    public http:HttpService
  ) {}
  data = inject(MAT_DIALOG_DATA);

  adminNote='';

  confirm(action: '通過' | '駁回'){
    const confirmRef=this.dialog.open(AnnounDialogComponent);
    confirmRef.afterClosed().subscribe((confirmed)=>{
      if(confirmed!=true){
        return;
      }

      this.http.postApi('http://localhost:8080/report/check',{reportId:this.data.reportId,
        active:action
      }).subscribe((res:any)=>{
        if(res.statusCode==200){
          console.log(res);
          this.dialogRef.close({ action });
        }
      });

    })
  }
}
