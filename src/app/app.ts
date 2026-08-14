import { ChangeDetectorRef, Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input'
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PetDialog, PetDialogData } from './pet-dialog/pet-dialog';
import { SetDialog, SetDialogData } from './set-dialog/set-dialog';
import { HelpDialog } from './help-dialog/help-dialog';

export interface Pet {
  编号: number; // NO.1
  名称: string;
  描述: string;
  介绍: string;
  特性: string[];
  属性: string[];
  总种族值: number;
  生命: number;
  物攻: number;
  魔攻: number;
  物防: number;
  魔防: number;
  速度: number;
  阶段: number; // 1阶
  进化等级: number; //lv.1
  进化方式: string;
  身高: number[];
  体重: number[];
  蛋组: string[];
  性别比例: string;
  进化链: string;
  有地区形态: boolean;
  有首领形态: boolean;
  有异色形态: boolean;
}
@Component({
  selector: 'app-root',
  imports: [CommonModule, MatInputModule, FormsModule, MatSlideToggleModule, MatSliderModule, MatDialogModule, MatButtonModule, MatIconModule, MatAutocompleteModule, MatFormFieldModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('pet-guess');
  private http = inject(HttpClient);
  private jsonPath = 'assets/petdex.json';
  pets = toSignal(this.getPets(), { initialValue: [] });
  data = [] as Pet[]
  finalPets = [] as Pet[]
  resultPet = {} as Pet
  inputValue = ''
  showMoreNumInfo = true
  showHeightAndWeight = true
  showEggAndSexInfo = true
  showSArrow = true
  easyModel = false
  guessChance = 10 // 3-15
  guessList = [] as Pet[]
  playing = false
  getPets(): Observable<Pet[]> {
    return this.http.get<Pet[]>(this.jsonPath);
  }
  constructor(
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private cd: ChangeDetectorRef
  ) {
    effect(() => {
      this.data = this.pets();
      if (this.data.length > 0) {
        this.finalPets = this.getFinalFormPets(this.data)
        this.start()
      }
    })
  }
  ngOnInit() {
  }
  getSNum(编号: number) { // S1
    if (编号 <= 347) {
      return 1
    } else if (348 <= 编号 && 编号 <= 375) {
      return 2
    } else if (376 <= 编号) {
      return 3
    }
    return 0
  }
  getAttacksComparison(pet: Pet) {
    if (pet['物攻'] > pet['魔攻']) {
      return '物攻>魔攻'
    } else if (pet['物攻'] < pet['魔攻']) {
      return '物攻<魔攻'
    } else {
      return '物攻=魔攻'
    }
  }
  getDefensesComparison(pet: Pet) {
    if (pet['物防'] > pet['魔防']) {
      return '物防>魔防'
    } else if (pet['物防'] < pet['魔防']) {
      return '物防<魔防'
    } else {
      return '物防=魔防'
    }
  }
  formatAverage(arr: number[]) {
    if (!arr || arr.length === 0) return 0;

    const sum = arr.reduce((a, b) => a + b, 0);
    const avg = sum / arr.length;

    // 先保留两位小数，再用 parseFloat 去除多余的 0
    return parseFloat(avg.toFixed(2));
  }
  start() {
    this.guessList = []
    if (this.easyModel) {
      const randomIndex = Math.floor(Math.random() * this.finalPets.length)
      this.resultPet = this.finalPets[randomIndex]
    } else {
      const randomIndex = Math.floor(Math.random() * this.data.length)
      this.resultPet = this.data[randomIndex]
    }
    this.playing = true
    this.cd.markForCheck()
  }
  guessFirst() {
    const randomIndex = Math.floor(Math.random() * this.data.length)
    this.guessList.push(this.data[randomIndex])
    this.cd.markForCheck()
    if (this.data[randomIndex]['名称'] === this.resultPet['名称']) {
      this.openPetDialog(true)
    }
  }
  setSearchList() {
    if (!this.inputValue.trim()) {
      return []
    } else {
      return this.data.filter(i => i['名称'].includes(this.inputValue.trim())).map(i => i['名称'])
    }
  }
  guessPet() {
    const guessPet = this.data.find(i => i['名称'] === this.inputValue.trim())

    if (!guessPet) {
      this.snackBar.open('未找到该精灵！', '关闭', {
        duration: 3000,
      });
      return
    }
    this.guessList = [guessPet, ...this.guessList]
    this.cd.markForCheck()
    if (this.inputValue.trim() === this.resultPet['名称']) {
      this.inputValue = ''
      this.openPetDialog(true)
      return
    }
    this.inputValue = ''
    if (this.guessList.length >= this.guessChance) {
      this.openPetDialog()
    }
  }
  openPetDialog(isSuccess = false) {
    this.playing = false

    const dialogRef = this.dialog.open(PetDialog, {
      width: '420px',
      disableClose: true,
      autoFocus: false,
      data: {
        pet: this.resultPet,
        isSuccess: isSuccess,
        guessCount: this.guessList.length,
        guessChance: this.guessChance
      } as PetDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'restart') {
        this.start();
      }
    });
  }
  openSetDialog() {
    const dialogRef = this.dialog.open(SetDialog, {
      width: '400px',
      autoFocus: false,
      data: {
        showMoreNumInfo: this.showMoreNumInfo,
        showHeightAndWeight: this.showHeightAndWeight,
        showEggAndSexInfo: this.showEggAndSexInfo,
        showSArrow: this.showSArrow,
        guessChance: this.guessChance,
        easyModel: this.easyModel
      } as SetDialogData
    });

    dialogRef.afterClosed().subscribe((result: SetDialogData | undefined) => {
      if (result) {
        this.showMoreNumInfo = result.showMoreNumInfo
        this.showHeightAndWeight = result.showHeightAndWeight
        this.showEggAndSexInfo = result.showEggAndSexInfo
        this.showSArrow = result.showSArrow
        this.guessChance = result.guessChance
        this.easyModel = result.easyModel
        this.cd.markForCheck()
        if (this.playing && this.guessList.length >= this.guessChance) {
          this.openPetDialog()
        }
        if (this.playing && this.easyModel && !this.finalPets.includes(this.resultPet)) {
          this.start()
        }
      }
    });
  }
  openHelpDialog() {
    this.dialog.open(HelpDialog, { autoFocus: false });
  }
  getFinalFormPets(data: Pet[]) {
    // 第一步：记录每个进化链对应的最大阶段数
    const maxStageMap = new Map<string, number>();

    for (const pet of data) {
      // 如果没有进化链标识，则将其名称作为唯一 key，当作独立的进化链处理
      const chainKey = pet.进化链 || pet.名称;

      // 获取该进化链目前记录的最大阶段，默认为 0
      const currentMaxStage = maxStageMap.get(chainKey) || 0;

      // 如果当前精灵的阶段更高，则更新记录
      if (pet.阶段 > currentMaxStage) {
        maxStageMap.set(chainKey, pet.阶段);
      }
    }

    // 第二步：筛选出阶段数等于该进化链最大阶段数的精灵
    const finalFormPets = data.filter((pet) => {
      const chainKey = pet.进化链 || pet.名称;
      return pet.阶段 === maxStageMap.get(chainKey);
    });

    return finalFormPets;
  }

  // 黄背景逻辑

  isBaseStatsYellow(总种族值: number) {
    if ((this.resultPet['总种族值'] - 50) <= 总种族值 && 总种族值 <= ((this.resultPet['总种族值'] + 50))) {
      return true
    }
    return false
  }
  isHPYellow(生命: number) {
    if ((this.resultPet['生命'] - 10) <= 生命 && 生命 <= ((this.resultPet['生命'] + 10))) {
      return true
    }
    return false
  }
  isSpeedYellow(速度: number) {
    if ((this.resultPet['速度'] - 10) <= 速度 && 速度 <= ((this.resultPet['速度'] + 10))) {
      return true
    }
    return false
  }
  isSNumYellow(赛季: number) {
    if ((this.getSNum(this.resultPet['编号']) - 1) <= 赛季 && 赛季 <= (this.getSNum(this.resultPet['编号']) + 1)) {
      return true
    }
    return false
  }
  isStageYellow(阶段: number) {
    if ((this.resultPet['阶段'] - 1) <= 阶段 && 阶段 <= ((this.resultPet['阶段'] + 1))) {
      return true
    }
    return false
  }
  isEvolutionMethodYellow(进化方式: string) {
    if (!this.resultPet['进化方式'] || !进化方式) {
      return false
    }
    const keywords = ['使用', '击败', '血脉', '突破', '天气', '点', '身高', '体重', '交互', '性']

    return keywords.some(keyword => this.resultPet['进化方式'].includes(keyword) && 进化方式.includes(keyword))
  }
  isEvolutionLVYellow(进化等级: number) {
    if ((this.resultPet['进化等级'] - 5) <= 进化等级 && 进化等级 <= (this.resultPet['进化等级'] + 5)) {
      return true
    }
    return false
  }
  isHeightYellow(平均身高: number) {
    if (this.formatAverage(this.resultPet['身高']) === 0 || 平均身高 === 0) return false
    return Math.abs(this.formatAverage(this.resultPet['身高']) - 平均身高) / this.formatAverage(this.resultPet['身高']) <= 0.2
  }
  isWeightYellow(平均体重: number) {
    if (this.formatAverage(this.resultPet['体重']) === 0 || 平均体重 === 0) return false
    return Math.abs(this.formatAverage(this.resultPet['体重']) - 平均体重) / this.formatAverage(this.resultPet['体重']) <= 0.2
  }

  // ↑↓箭头逻辑

  getBaseStatsArrow(总种族值: number) {
    if (总种族值 < this.resultPet['总种族值']) {
      return '↑'
    } else if (总种族值 > this.resultPet['总种族值']) {
      return '↓'
    } else {
      return ''
    }
  }
  getHPArrow(生命: number) {
    if (生命 < this.resultPet['生命']) {
      return '↑'
    } else if (生命 > this.resultPet['生命']) {
      return '↓'
    } else {
      return ''
    }
  }
  getSpeedArrow(速度: number) {
    if (速度 < this.resultPet['速度']) {
      return '↑'
    } else if (速度 > this.resultPet['速度']) {
      return '↓'
    } else {
      return ''
    }
  }
  getSNumArrow(赛季: number) {
    if (!this.showSArrow) {
      return ''
    }
    if (赛季 < this.getSNum(this.resultPet['编号'])) {
      return '↑'
    } else if (赛季 > this.getSNum(this.resultPet['编号'])) {
      return '↓'
    } else {
      return ''
    }
  }
  getStageArrow(阶段: number) {
    if (阶段 < this.resultPet['阶段']) {
      return '↑'
    } else if (阶段 > this.resultPet['阶段']) {
      return '↓'
    } else {
      return ''
    }
  }
  getEvolutionLVArrow(进化等级: number) {
    if (进化等级 < this.resultPet['进化等级']) {
      return '↑'
    } else if (进化等级 > this.resultPet['进化等级']) {
      return '↓'
    } else {
      return ''
    }
  }
  getHeightArrow(平均身高: number) {
    if (平均身高 < this.formatAverage(this.resultPet['身高'])) {
      return '↑'
    } else if (平均身高 > this.formatAverage(this.resultPet['身高'])) {
      return '↓'
    } else {
      return ''
    }
  }
  getWeightArrow(平均体重: number) {
    if (平均体重 < this.formatAverage(this.resultPet['体重'])) {
      return '↑'
    } else if (平均体重 > this.formatAverage(this.resultPet['体重'])) {
      return '↓'
    } else {
      return ''
    }
  }
}
