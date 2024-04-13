import {Component} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonDatetime,
  IonButton, IonList, AlertController
} from '@ionic/angular/standalone';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf} from "@angular/common";
import {Storage} from "@ionic/storage";


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonDatetime, IonButton, IonList, FormsModule, DatePipe, NgForOf],
  providers: [Storage]
})

export class HomePage {
  alarmTime: string = ''; // Almacena la hora de la alarma seleccionada
  alarms: { time: Date }[] = []; // Array para almacenar objetos de alarma
  constructor(private alertController: AlertController, private storage: Storage) {
  }

  async ngOnInit() {
    if (!this.storage.driver) {
      await this.storage.create();
    }

    const storedAlarms = await this.storage.get('alarms');

    if (storedAlarms) {
      // @ts-ignore
      this.alarms = storedAlarms.map(alarm => ({time: new Date(alarm.time)}));

      // Filter alarms to delete old ones
      this.alarms = this.alarms.filter(alarm => alarm.time.getTime() > new Date().getTime());

      // Sort the alarms in asc order
      await this.sortAlarmsAndSave();

      // Make the timer to reproduce the sound at the exact moment
      this.alarms.forEach(alarm => {
        const timeUntilAlarm = alarm.time.getTime() - new Date().getTime();
        setTimeout(() => this.playAlarm(), timeUntilAlarm);
      });
    }

  }

  async setAlarm() {
    if (this.alarmTime) {
      // Transform alarm string to date
      const alarmDate: Date = new Date(this.alarmTime);
      // Check if the user tries to configure a past alarm
      if (alarmDate.getTime() > new Date().getTime()) {
        await this.configureAlarm(alarmDate);
      } else {
        const alert = await this.alertController.create({
          header: 'Error',
          message: `You cannot establish an alarm in the past ${alarmDate}. Please, provide a future date.`,
          buttons: ['OK']
        })
        await alert.present();
      }
    }
  }

  // Reproduce the alarm
  async playAlarm() {
    const audio = new Audio('assets/audio/alarms/mixkit-warning-alarm-buzzer.wav');
    await audio.play();
    const alert = await this.alertController.create({
      header: 'ALARM!',
      message: `Please stop me.`,
      buttons: [{
        text: "Stop", handler: () => {
          audio.pause();
          audio.currentTime = 0;
        }
      }]
    })
    await alert.present();
  }

  async configureAlarm(alarmDate: Date) {
    // Add the alarm to the alarms array
    this.alarms.push({time: alarmDate});

    // Sort and save the alarms in the storage
    await this.sortAlarmsAndSave();

    // Program the alarm
    const timeUntilAlarm = alarmDate.getTime() - new Date().getTime();
    setTimeout(() => this.playAlarm(), timeUntilAlarm);

    // Limpia el campo de entrada
    this.alarmTime = '';
  }

  async showAlarms() {
    const alert = await this.alertController.create({
      header: 'Alarmas Programadas',
      message: this.getFormattedAlarms(),
      buttons: ['Cerrar']
    });
    await alert.present();
  }

  private getFormattedAlarms(): string {
    // Formatea las alarmas como una cadena de texto
    // Puedes personalizar esto según tus necesidades
    return this.alarms.map(alarm => alarm.time.toLocaleTimeString()).join('\n');
  }

  async deleteAlarm(index: number) {
    // Elimina la alarma del array de alarmas
    this.alarms.splice(index, 1);

    // Actualiza las alarmas en el almacenamiento
    await this.storage.set('alarms', this.alarms);
  }

  async sortAlarmsAndSave() {
    this.alarms.sort((a, b) => a.time.getTime() - b.time.getTime());
    await this.storage.set('alarms', this.alarms);
  }
}
