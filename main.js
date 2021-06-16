const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
};

const Symbols = [
  "https://image.flaticon.com/icons/svg/105/105223.svg", // 黑桃
  "https://image.flaticon.com/icons/svg/105/105220.svg", // 愛心
  "https://image.flaticon.com/icons/svg/105/105212.svg", // 方塊
  "https://image.flaticon.com/icons/svg/105/105219.svg", // 梅花
];
const view = {
  getCardContent(index) {
    //負責生成卡片內容，包括花色和數字
    const number = this.transformNumber((index % 13) + 1);
    const symbol = Symbols[Math.floor(index / 13)];
    return `
        <p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>`;
  },

  getCardElement(index) {
    //負責生成卡片背面花圖
    return `
      <div data-index = "${index}" class="card back"></div>`;
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return number;
    }
  },
  displayCards(indexes) {
    //將打散得陣列傳入，單純的做顯示的動作
    //負責選出 #cards 並抽換內容
    const rootElement = document.querySelector("#cards");
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index))
      .join("");
  },

  flipCards(...cards) {
    cards.map((card) => {
      if (card.classList.contains("back")) {
        card.classList.remove("back");
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        //如果是背面，會傳正面
        return;
      }
      card.classList.add("back");
      card.innerHTML = null;
      //如果是正面，回傳背面
    });
  },

  pairCards(...cards) {
    cards.map((card) => {
      card.classList.add("paired");
    });
  },

  renderScore(score) {
    document.querySelector(".score").textContent = `目前分數:${score}分`;
  },

  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `目前翻牌次數：${times}次`;
  },
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      card.classList.add("wrong");
      card.addEventListener(
        "animationend",
        (event) => event.target.classList.remove("wrong"),
        { once: true }
      );
    });
  },
  showGameFinished() {
    const div = document.createElement("div");

    div.classList.add("completed");
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `;
    const header = document.querySelector("#header");
    header.before(div);
  },
};

const model = {
  revealedCards: [], // 是一個暫存牌組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空。

  isRevealedCardsMatched() {
    //此函式可判斷第一張牌與第二張牌的數字是否相同
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },
  score: 0,

  triedTimes: 0,
};

// controller 會依遊戲狀態來分配動作
const controller = {
  currentState: GAME_STATE.FirstCardAwaits, //currentState 屬性，用來標記目前的遊戲狀態

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52));
  },

  //依照不同的遊戲狀態，做不同的行為。
  dispatchCardAction(card) {
    if (!card.classList.contains("back")) {
      return;
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits: //第一個狀態會發生的事情
        view.renderTriedTimes(++model.triedTimes);
        view.flipCards(card); //翻開這張卡片
        model.revealedCards.push(card);
        this.currentState = GAME_STATE.SecondCardAwaits; //狀態改成要等待番第二張牌
        break;
      case GAME_STATE.SecondCardAwaits: //第二個狀態會發生的事情
        view.flipCards(card); //翻開這張卡片
        model.revealedCards.push(card);
        if (model.isRevealedCardsMatched()) {
          //配對正確
          view.renderScore((model.score += 10));
          this.currentState = GAME_STATE.CardsMatched;
          view.pairCards(...model.revealedCards);
          model.revealedCards = [];
          if (model.score === 260) {
            console.log("showGameFinished");
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished();
            return;
          }
          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed;
          view.appendWrongAnimation(...model.revealedCards);
          setTimeout(this.resetCards, 1000);
        }
        break;
    }
    console.log("this.currentState", this.currentState);
    console.log(
      "revealedCards",
      model.revealedCards.map((card) => card.dataset.index)
    );
  },

  resetCards() {
    view.flipCards(...model.revealedCards); //翻回背面
    model.revealedCards = []; //清空
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys());
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

controller.generateCards();

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (e) => {
    controller.dispatchCardAction(card);
  });
});
