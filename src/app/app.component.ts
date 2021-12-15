import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
const mediaConstraints = {
  audio:true,
  video:{width:1000,height:540}
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit,AfterViewInit{
  title = 'videoCall';
  private UserStream!:MediaStream

  @ViewChild("userVideoStream")userVideoStream!:ElementRef
  ngOnInit() {
    var locationPort:any
    if(location.port){
      locationPort=':'+location.port.toString()
    }else{
      locationPort=''
    }

  }
  ngAfterViewInit():void{
    this.requestMediaDevices()
  }

  private async requestMediaDevices():Promise<void>{
   this.UserStream=await navigator.mediaDevices.getUserMedia(mediaConstraints)
    console.log(this.UserStream)
    this.userVideoStream.nativeElement.srcObject=this.UserStream
    console.log(this.userVideoStream)
  }

  pauseLocalVideo(){
    this.UserStream.getTracks().forEach(track=>{
      track.enabled=false
    })
    this.userVideoStream.nativeElement.srcObject=undefined
  }

  startLocalVideo(){
    this.UserStream.getTracks().forEach(track=>{
      track.enabled=true
    })
    this.userVideoStream.nativeElement.srcObject=this.UserStream
  }
}
