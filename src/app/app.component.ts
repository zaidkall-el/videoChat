import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
const mediaConstraints = {
  audio:true,
  video:{width:720,height:540}
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'videoCall';
  private UserStream!:MediaStream
  @ViewChild("userVideoStream")userVideoStream!:ElementRef
  ngOnInit() {

  }
  ngAfterViewInit():void{
    this.requestMediaDevices()
  }
  private async requestMediaDevices():Promise<void>{
   this.UserStream=await navigator.mediaDevices.getUserMedia(mediaConstraints)
    this.userVideoStream.nativeElement.srcObject=this.UserStream
  }
}
