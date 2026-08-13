import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatDialogModule,
    MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';


@Component({
    selector: 'app-help-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule
    ],
    templateUrl: './help-dialog.html',
    styleUrl: './help-dialog.scss'
})
export class HelpDialog {
    readonly dialogRef = inject(MatDialogRef<HelpDialog>);

    cancel() {
        this.dialogRef.close();
    }
}