import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ClrModal} from '@clr/angular';

import RFB from "../../../../../../node_modules/@novnc/novnc/core/rfb.js";
import {RestfulService} from '../../../../shared/services/restful.service';

@Component({
  selector: 'app-remote-desktop-modal',
  templateUrl: './remote-desktop-modal.component.html',
  styleUrls: ['./remote-desktop-modal.component.scss']
})
export class RemoteDesktopModalComponent implements OnInit {

  @Output() finishEvent = new EventEmitter();
  @ViewChild(ClrModal) modal: ClrModal;
  opened: boolean;
  public rfb: RFB;
  basePort: string;
  domainPort: string;
  pid: string;

  constructor(private restfulservice: RestfulService) { }

  open(basePort: string, domainPort: string){
    this.modal.open();
    this.basePort = basePort;
    this.domainPort = domainPort;
  }

  connect(){
    console.log("Conectando...");
    this.restfulservice.startWebsockify({port: this.domainPort})
        .subscribe((data:any) => {
          this.pid = data;
          const host = window.location.hostname;
          const password = "123";
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

          console.log(url);

          this.rfb = new RFB(document.getElementById("screen"), url, {
            credentials: {password: password},
          });
        });
  }

  ngOnInit() {
  }

  onClose() {
    if (this.rfb) {
      this.rfb.disconnect();
    }
    this.restfulservice.stopWebsockify({pid: this.pid})
        .subscribe((data:any) => {
          this.opened = false;
        })
  }
}
