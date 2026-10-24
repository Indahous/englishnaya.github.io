/* Список игр для страницы /games/.
   Чтобы добавить новую игру, замените «Скоро» своей записью:
   { title: "Название", desc: "Короткое описание", img: "img/превью.jpg", href: "/games/имя-игры/", age: "0–5" }
   Сетка рассчитана на 9 карточек; пустые места заполняются заготовками «Скоро». */
window.GAMES = [
  {
    title: "Помоги Ёжику поймать листья!",
    desc: "Выбери героя и лови осенние листья нужного цвета. Учим цвета по-английски.",
    img: "img/preview-leaves.jpg",
    href: "/games/leaves/",
    age: "0–5 лет"
  },
  {
    title: "Who Did It? Passive Voice",
    desc: "Детективная игра про пассивный залог: Level 1 «Library» и Level 2 «Derry».",
    img: "img/preview-passive.jpg",
    href: "/passive-voice/",
    age: "от 14 лет · B2"
  }
];
window.GAMES_SLOTS = 9;
