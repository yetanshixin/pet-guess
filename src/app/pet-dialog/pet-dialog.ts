import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MatDialogModule,
    MatDialogRef,
    MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Pet } from '../app';

export interface PetDialogData {
    isSuccess: boolean;
    pet: Pet;
    guessCount: number;
    guessChance: number;
}

@Component({
    selector: 'app-pet-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './pet-dialog.html',
    styleUrl: './pet-dialog.scss'
})
export class PetDialog {
    readonly dialogRef = inject(MatDialogRef<PetDialog>);
    readonly data = inject<PetDialogData>(MAT_DIALOG_DATA);

    close() {
        this.dialogRef.close();
    }

    restart() {
        this.dialogRef.close('restart');
    }

    getHeadText() {
        if (this.data.isSuccess) { // 成功
            return '太厉害了，鼓掌鼓掌👏👏👏'
        } else if (this.data.guessCount >= this.data.guessChance) { // 机会用尽
            return '没机会了，游戏结束😵😵😵'
        } else { // 投降
            return '你已投降，游戏结束😓😓😓'
        }
    }
}