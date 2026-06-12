import type { SkillBranch, SkillTreeNode } from '@/lib/skill-tree'

type BranchLabels = {
  root: string
  attack1: string
  attack2: string
  attack3: string
  defense1: string
  defense2: string
  passive: string
  topicName: string
}

function makeBranch(
  branch: SkillBranch,
  baseId: number,
  xBase: number,
  icon: string,
  labels: BranchLabels,
  spineRequires: number | null,
): SkillTreeNode[] {
  const R = baseId
  const t = branch
  return [
    {
      id: R, branch: t, name: labels.root, type: 'passive', icon,
      description: `Вход в тему «${labels.topicName}». Открывает атаки и защиты этой ветки.`,
      effect: { kind: 'xp_bonus', value: 5, topic: t, detail: `+5% XP за задачи на ${labels.topicName}` },
      cost: 0, requires: spineRequires, position_x: xBase, position_y: 300,
    },
    {
      id: R + 1, branch: t, name: labels.attack1, type: 'attack', icon: '⚔',
      description: `Правильный ответ на простой пример (${labels.topicName}) наносит дополнительный урон.`,
      effect: { kind: 'damage_bonus', value: 15, topic: t, detail: `+15% урона в теме «${labels.topicName}»` },
      cost: 1, requires: R, position_x: xBase - 70, position_y: 220,
    },
    {
      id: R + 2, branch: t, name: labels.attack2, type: 'attack', icon: '⚔',
      description: `Усилённая атака для средних примеров (${labels.topicName}).`,
      effect: { kind: 'damage_bonus', value: 25, topic: t, detail: `+25% урона на средних примерах` },
      cost: 2, requires: R + 1, position_x: xBase - 110, position_y: 130,
    },
    {
      id: R + 3, branch: t, name: labels.attack3, type: 'attack', icon: '⚔',
      description: `Мощный удар на сложных примерах (${labels.topicName}).`,
      effect: { kind: 'damage_bonus', value: 35, topic: t, detail: `+35% урона на сложных примерах` },
      cost: 2, requires: R + 2, position_x: xBase - 150, position_y: 50,
    },
    {
      id: R + 4, branch: t, name: labels.defense1, type: 'defense', icon: '🛡',
      description: `Верный ответ на ${labels.topicName} даёт щит от следующего удара монстра.`,
      effect: { kind: 'shield', value: 1, topic: t, detail: 'Щит после верного ответа' },
      cost: 1, requires: R, position_x: xBase + 70, position_y: 220,
    },
    {
      id: R + 5, branch: t, name: labels.defense2, type: 'defense', icon: '🛡',
      description: `Снижает входящий урон после верного ответа на ${labels.topicName}.`,
      effect: { kind: 'damage_reduction', value: 20, topic: t, detail: '−20% входящего урона' },
      cost: 2, requires: R + 4, position_x: xBase + 110, position_y: 130,
    },
    {
      id: R + 6, branch: t, name: labels.passive, type: 'passive', icon: '✦',
      description: `Мастерство темы «${labels.topicName}». Открывает следующую тему на древе.`,
      effect: { kind: 'xp_bonus', value: 8, topic: t, detail: `+8% XP в теме «${labels.topicName}»` },
      cost: 2, requires: R, position_x: xBase, position_y: 180,
    },
  ]
}

/** Одно древо: каждая тема требует пассивку предыдущей (как в PoE). */
export const ALL_SKILL_TREE_NODES: SkillTreeNode[] = [
  ...makeBranch('add', 1, 100, '➕', {
    root: 'Корень сложения',
    attack1: 'Удар сложением',
    attack2: 'Двузначный разряд',
    attack3: 'Тройной удар',
    defense1: 'Щит суммы',
    defense2: 'Стойкость счёта',
    passive: 'Мастер прибавления',
    topicName: 'сложение',
  }, null),
  ...makeBranch('sub', 8, 320, '➖', {
    root: 'Корень вычитания',
    attack1: 'Удар вычитанием',
    attack2: 'Двузначная разность',
    attack3: 'Тройной вычет',
    defense1: 'Щит разности',
    defense2: 'Стойкость вычета',
    passive: 'Мастер вычитания',
    topicName: 'вычитание',
  }, 7),
  ...makeBranch('mul', 15, 560, '✕', {
    root: 'Корень умножения',
    attack1: 'Удар умножением',
    attack2: 'Таблица мастер',
    attack3: 'Комбо умножения',
    defense1: 'Щит произведения',
    defense2: 'Стойкость таблицы',
    passive: 'Мастер умножения',
    topicName: 'умножение',
  }, 14),
  ...makeBranch('div', 22, 800, '÷', {
    root: 'Корень деления',
    attack1: 'Удар делением',
    attack2: 'Крупный делитель',
    attack3: 'Тройное деление',
    defense1: 'Щит частного',
    defense2: 'Стойкость частного',
    passive: 'Мастер деления',
    topicName: 'деление',
  }, 21),
  ...makeBranch('frac', 29, 1040, '½', {
    root: 'Корень дробей',
    attack1: 'Удар дробями',
    attack2: 'Общий знаменатель',
    attack3: 'Смешанные числа',
    defense1: 'Щит дроби',
    defense2: 'Стойкость частей',
    passive: 'Мастер дробей',
    topicName: 'дроби',
  }, 28),
  ...makeBranch('pct', 36, 1280, '%', {
    root: 'Корень процентов',
    attack1: 'Удар процентов',
    attack2: 'Скидка и наценка',
    attack3: 'Пропорции',
    defense1: 'Щит процента',
    defense2: 'Стойкость пропорции',
    passive: 'Мастер процентов',
    topicName: 'проценты',
  }, 35),
]
