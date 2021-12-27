import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DataService,Message} from "./services/data.service";

const mediaConstraints = {
  audio: true,
  video: {width: 1000, height: 540}
}
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'webrtc';
  private UserStream!: MediaStream
  private peerConnection!: RTCPeerConnection
  @ViewChild("userVideoStream") userVideoStream!: ElementRef
  @ViewChild("guestVideoStream") guestVideoStream!: ElementRef

  constructor(private dataService: DataService) {
  }

  ngAfterViewInit() {
    this.addIncomingMessageHandler()
    this.requestMediaDevices()
  }

  ngOnInit() {
  }

  private async requestMediaDevices(): Promise<void> {
    this.UserStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
    console.log(this.UserStream)
    this.userVideoStream.nativeElement.srcObject = this.UserStream
    console.log(this.userVideoStream)
  }

  pauseLocalVideo() {
    this.UserStream.getTracks().forEach(track => {
      track.enabled = false
    })
    this.userVideoStream.nativeElement.srcObject = undefined
  }

  startLocalVideo() {
    this.UserStream.getTracks().forEach(track => {
      track.enabled = true
    })
    this.userVideoStream.nativeElement.srcObject = this.UserStream
  }

  async call(): Promise<any> {
    this.createPeerConnection()
    this.UserStream.getTracks().forEach(
      track => this.peerConnection.addTrack(track, this.UserStream)
    )
    try {
      const Offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions)
      await this.peerConnection.setLocalDescription(Offer)
      var types = 'offer'
      var data = Offer
      var coversation_id = 2
      this.dataService.sendOfferAndResponceRTCConnection(types, data, coversation_id).subscribe(
        res=>{
          console.log(res)
        }
      )
    } catch (err) {
      console.log("call")
      this.handleGetUserMediaErorr(err)
    }
  }

  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ['stun:stun.kundenserver.de:3478']
        }
      ]
    })
    this.peerConnection.onicecandidate = this.handleIceCandidateEvent
    this.peerConnection.onicegatheringstatechange = this.handleIceConnectionStateChangeEvent
    this.peerConnection.onsignalingstatechange = this.hnadleSignalingStateEvent
    this.peerConnection.ontrack = this.handleTrackEvent

  }

  closeVideoCall(): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null
      this.peerConnection.onicegatheringstatechange = null
      this.peerConnection.onsignalingstatechange = null
      this.peerConnection.ontrack = null
    }
    this.peerConnection.getTransceivers().forEach(transive => {
      transive.stop()
    })
    this.peerConnection.close()
    this.peerConnection = null as any
  }

  private handleGetUserMediaErorr(e: Error) {
    switch (e.name) {
      case 'NotFoundError':
        console.log('unable to open your call because no camera or audio found')
        break;
      case 'securityError':
        break;
      case 'PermissionDeniedError':
        break;
      default:
        console.log(e);
        console.log('Error opening camera' + e.message);
        break;

    }
    this.closeVideoCall()
  }

  handleIceCandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log(event)
    if (event.candidate) {
      var types = 'candidate'
      var data = event.candidate
      var coversation_id = 2
      this.dataService.sendOfferAndResponceRTCConnection(types, data, coversation_id)
    }
  }
  handleIceConnectionStateChangeEvent = (event: Event) => {
    console.log(event)
    switch (this.peerConnection.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall()
        break
    }

  }
  hnadleSignalingStateEvent = (event: Event) => {
    console.log(event)
    switch (this.peerConnection.signalingState) {
      case "closed":
        this.closeVideoCall()
        break;

    }
  }
  handleTrackEvent = (event: RTCTrackEvent) => {
    console.log(event)
    this.guestVideoStream.nativeElement.srcObject=event.streams[0]
  }
  addIncomingMessageHandler(){
    this.dataService.connect()
    this.dataService.messages.subscribe(
      msg=>{
        console.log(msg.types)
        switch (msg.types) {
          case 'offer':
            this.handleOfferMessage(msg.message)
            break;
          case 'answer':
            this.handleAnswerMessage(msg.message)
            break;
          case 'hangup':
            this.handleHangeupMessage(msg)
            break;
          case 'candidate':
            this.handleIceCandidateMessage(msg.message)
            break;
          default:
            console.log('unknown message of type'+msg.types)
        }
      },error => {
        console.log(error)
      }
    )
  }

  private handleOfferMessage(msg:RTCSessionDescriptionInit) {
    if(!this.peerConnection){
      console.log("create peer")
      this.createPeerConnection()

    }
    if (!this.UserStream){
      console.log("this.userStream")
      this.startLocalVideo()
    }
    if (msg.sdp != null) {
      console.log("msg.sdp")
      this.peerConnection.setLocalDescription(new RTCSessionDescription(msg))
        .then(() => {
          this.userVideoStream.nativeElement.srcObject = this.UserStream
          this.UserStream.getTracks().forEach(
            track => this.peerConnection.addTrack(track, this.UserStream)
          )
        }).then(() => {
        return this.peerConnection.createAnswer()
      }).then((answer) => {
        return this.peerConnection.setLocalDescription(answer)
      }).then(() => {
        var types = 'answer'
        var data = this.peerConnection.localDescription
        var coversation_id = 2
        this.dataService.sendOfferAndResponceRTCConnection(types, data, coversation_id).subscribe(
          res => {
            console.log(res)
          }
        )
      }).catch(
        this.handleGetUserMediaErorr
      )
    }
  }

  private handleAnswerMessage(message:RTCSessionDescription):void {
    this.peerConnection.setRemoteDescription(message)
  }

  private handleHangeupMessage(msg:Message ) {
    this.closeVideoCall()
  }

  private handleIceCandidateMessage(message:any) {
    this.peerConnection.addIceCandidate(message).catch(this.reportError)
  }
  private reportError = (e:Error)=>{
    console.log('got Error' + e.name)
    console.log(e)
  }
  hangup():void {
    var types = 'hangup'
    var data = ''
    var coversation_id = 2
    this.dataService.sendOfferAndResponceRTCConnection(types, data, coversation_id)
    this.closeVideoCall()
  }
}
