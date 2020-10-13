import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {ClrModal} from '@clr/angular';

import RFB from "../../../../../../node_modules/@novnc/novnc/core/rfb.js";
import {RestfulService} from '../../../../shared/services/restful.service';

@Component({
  selector: 'app-remote-desktop-modal',
  templateUrl: './remote-desktop-modal.component.html',
  styleUrls: ['./remote-desktop-modal.component.scss']
})
export class RemoteDesktopModalComponent {

  @Output() finishEvent = new EventEmitter();
  @ViewChild(ClrModal) modal: ClrModal;
  opened: boolean;
  public rfb: RFB;
  basePort: string;
  domainPort: string;
  pid: string;
  alert: { success:any, error: any};
  password: string;
  connecting: boolean = false;
  loadingMessage: string = "";

  constructor(private restfulservice: RestfulService) {
      this.alert = {success: undefined, error: undefined};
  }

  open(basePort: string, domainPort: string){
    this.modal.open();
    this.basePort = basePort;
    this.domainPort = domainPort;
  }

  connect(){
    this.connecting = true;
    this.loadingMessage = " Iniciando Websockify en el servidor"
    this.restfulservice.startWebsockify({port: this.domainPort})
        .subscribe((data:any) => {
          this.pid = data;
          const host = window.location.hostname;
          const path = "websockify";

          let url = "ws";

          if (window.location.protocol === "https:") {
            url = "wss";
          } else {
            url = "ws";
          }

          url += "://" + host;
          if (this.basePort){
            url += ":" + this.basePort;
          }
          url += "/" + path;

          this.loadingMessage = "Iniciando conexión con el escritorio remoto";
          this.rfb = new RFB(document.getElementById("screen"), url, {
            credentials: {password: this.password},
          });
          this.loadingMessage = undefined;

          this.rfb.addEventListener('securityfailure',
              (data: any) => {
              this.alert.error = 'Error de seguridad: ' + data.detail.reason;
              this.connecting = false;
              this.loadingMessage = undefined;
              this.restfulservice.stopWebsockify({ pid: this.pid})
                  .subscribe((data:any) => {});
          });

        });
  }
  onClose() {
    if (this.rfb) {
      this.rfb.disconnect();
    }
    if (this.pid){
        this.restfulservice.stopWebsockify({pid: this.pid})
            .subscribe((data:any) => {
                this.resetElements();
            });
    } else {
        this.resetElements();
    }
  }

  private resetElements(){
      this.opened = false;
      this.connecting = false;
      this.password = "";
      this.loadingMessage = undefined;
      this.alert = {success: undefined, error: undefined};
  }
}
