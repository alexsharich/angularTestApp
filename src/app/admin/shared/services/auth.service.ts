import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../../../enviroments/environment";
import { Observable, Subject, throwError } from "rxjs";
import {catchError, tap} from "rxjs/operators"
import { User, FbAuthResponse} from "../../shared/interfaces";

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  public error$: Subject<string> = new Subject<string>()

  constructor(private http:HttpClient){

  }

get token(): string | null {
  //@ts-ignore
  const expDate = new Date(localStorage.getItem('fb-token-exp'))
  if(new Date() > expDate){
    this.logout()
    return null
  }
  return localStorage.getItem('fb-token')
}

  login(user:User):Observable<any>{
    user.returnSecureToken = true
    return this.http.post<any>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`,user)
    .pipe(
      tap(this.setToken),
      catchError(this.handleError.bind(this))
    )
  }
  logout(){
    this.setToken(null)
  }
  isAuthenticated(): boolean{
    return !!this.token
  }
  private handleError(error:HttpErrorResponse):any{
    const {message} = error.error.error

    switch(message){
      case 'INVALID_EMAIL':
        this.error$.next('Bad email')
      break
      case 'INVALID_PASSWORD':
        this.error$.next('Bad password')
      break
      case 'EMAIL_NOT_FOUND':
        this.error$.next('Email not found')
      break
      case 'MISSING_CUSTOM_TOKEN':
        this.error$.next('Problems with token')
      break
    }
    return throwError(error)
  }

  private setToken(response:FbAuthResponse | null){
    if(response){
      const expDate = new Date (new Date().getTime() + +response.expiresIn * 1000)
      localStorage.setItem('fb-token',response.idToken)
      localStorage.setItem('fb-token-exp',expDate.toString())
    } else {
      localStorage.clear()
    }
  }
}
