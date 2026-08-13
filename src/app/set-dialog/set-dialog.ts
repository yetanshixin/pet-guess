import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    MatDialogModule,
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SetDialogData {
    showMoreNumInfo: boolean;
    showEggAndSexInfo: boolean;
    showSArrow: boolean;
    guessChance: number;
    easyModel: boolean
}

@Component({
    selector: 'app-set-dialog',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatSliderModule,
        MatTooltipModule
    ],
    templateUrl: './set-dialog.html',
    styleUrl: './set-dialog.scss'
})
export class SetDialog {
    readonly dialogRef = inject(MatDialogRef<SetDialog>);
    readonly data = inject<SetDialogData>(MAT_DIALOG_DATA);
    currentSettings: SetDialogData = { ...this.data };

    cancel() {
        this.dialogRef.close();
    }

    save() {
        this.dialogRef.close(this.currentSettings);
    }
}