import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { timer } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface Card {
  id?: number;
  disabled?: boolean;
}

enum GameState {
  GameOver = 'game-over',
  CountdownSelectChoice = 'countdown-select-choice',
  RoundCooldown = 'round-cooldown',
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  // with duplicates
  // allCardsTotal: Card[] = [];

  cards: Card[] = [];
  // selectedCards: Card[] = [];
  selectedCardIndex: null | number = null;

  gameReady = true;
  canSelectCard = true;
  gameInCooldown = false;
  userScreenText = '';

  // showIntro = true;
  // showOutro = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startGameLoop();
  }

  startGameLoop() {
    timer(0, 1000).subscribe(() => {
      this.gameTick();
    });
  }

  gameTick() {
    this.loadGameStateAndStats();
  }

  saveTextToDb() {
    this.http
      .post(
        'https://twitch-memo-function-1.azurewebsites.net/api/SetScreenText?code=oCfZL7aobgC3x-lkkfj9KlMOH2ZiNMPSA2TI9HhiVD6aAzFuvKSWlw==',
        {
          setText: this.userScreenText,
        }
      )
      .subscribe((data) => {
        console.log('response:', data);
        this.userScreenText = '';
      });
  }
  gotoNextTask() {
    console.log('done!');
  }

  loadGameStateAndStats() {
    // TODO
    this.http
      .get(
        'https://twitch-memo-function-1.azurewebsites.net/api/GetGameStateAndStats?code=7QJg59i9k4n4yH8I-3ftuPvbGnNEnA6sVEi8oOwXc_KoAzFu6645Sw=='
      )
      .subscribe((data: any) => {
        // console.log(
        //   'response:',
        //   data,
        // );
        this.setGameState(data.state);
        const activeCardIndexes: string[] = data.active_card_indexes.split(',');
        this.cards = Array.from(Array(+data.total_cards).keys()).map(
          (current, index) => {
            return {
              id: index,
              disabled:
                activeCardIndexes.some(
                  (currentCardIndex: string) => +currentCardIndex === index
                ) === false,
            };
          }
        );
      });
  }

  setGameState(newState: GameState) {
    this.gameReady = !(newState === GameState.GameOver);
    this.canSelectCard = newState === GameState.CountdownSelectChoice;
    this.gameInCooldown = newState === GameState.RoundCooldown;
    if (this.gameInCooldown) {
      this.selectedCardIndex = null;
    }
  }

  pollForGameUpdates() {
    //TODO
    // like what cards are still active
  }

  clickedCard(card: Card) {
    if (!this.canSelectCard) {
      return;
    }
    this.selectedCardIndex = card.id ?? null;
    // TODO send to backend

    this.http
      .post(
        'https://twitch-memo-function-1.azurewebsites.net/api/PostVote?code=PiqLF7GN4Uw7EJuFm3tEOlLV_Nv4YI5HdnQkYXV7gdlxAzFuWwYwNA== ',
        {
          id: this.getUserId(),
          card_id: card.id,
        }
      )
      .subscribe((data) => {
        console.log('response:', data);
      });
  }

  getUserId() {
    // v4 is random, v5 is deterministic
    const generateUuid = () => uuidv4();
    if (localStorage.getItem('userId')) {
      return localStorage.getItem('userId');
    }
    const userId = generateUuid();
    localStorage.setItem('userId', userId);
    return userId;
  }
}
