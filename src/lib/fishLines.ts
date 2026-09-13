/** 点导航栏小鱼时的弹幕文案（每轮打乱，用完再开下一轮） */
export const FISH_LINES = [
  "咕噜～被摸到了",
  "今天也轻轻游一下",
  "再摸一下会害羞的",
  "正经摸鱼中…",
  "尾巴摇两下算回礼",
  "水面下也在偷偷学一点",
  "摸得多了会变成金鱼哦",
  "泡泡冒上来了 o O",
  "先歇一会儿，等会儿再学",
  "你一摸，我就醒了",
  "别吵，我在数今日收获",
  "我去游一会儿再回来陪你",
  "今天状态：软软的",
  "被发现啦，还在摸鱼",
  "再点一下，我教你吐泡泡",
  "摸鱼也是一种休息方式",
  "你来啦，我绕着你游一圈啦",
  "别催，我正在充电",
  "今天水温刚刚好",
  "学完了再来找我玩",
  "我假装没看见你摸我",
  "哇，手暖暖的",
  "再摸就沉下去躲起来了",
  "摸摸鱼，好运加一点点",
  "嗯？又来摸我啦",
  "今天尾巴特别灵活",
  "摸一下，烦恼少一点",
  "我在练闭气，别打扰我",
  "水面波纹是我写给你的字",
  "慢慢来，鱼也不能太忙",
  "咕咚一声，我钻进水草里了",
  "今晚也要早点休息哦",
  "今天也要开心哦",
  "哎呦，温柔一点嘛",
  "我刚刚做了个美梦",
  "水里很安静，适合想事情",
  "摸鱼打卡成功，嘻嘻",
  "你一靠近，我就游过来了",
  "今天的阳光漏进水里了",
  "别急，好事会慢慢游过来",
  "我把烦恼吹成泡泡啦",
  "偷偷告诉你：今天也想你啦",
  "鱼也会想被夸奖的",
  "今天游了很远呀",
  "你忙的时候，我就在旁边吐泡泡",
  "摸摸鱼，烦恼沉下水底",
  "再陪我一会儿吧",
  "尾巴一甩，晦气走掉",
  "今天也是可爱的一天",
  "喝口水，继续加油",
  "今天也来报到啦",
  "我在发呆，你也一起吧",
  "游累了就靠着你歇会儿",
  "今日心情：亮晶晶",
  "水草后面有个小秘密",
  "今天也要把自己照顾好",
  "我把好运装进泡泡里了",
  "摸鱼时间到～",
  "我在练转圈，看我帅不帅",
  "有心事可以跟我说哦",
  "每天进步一点点",
  "我在躲猫猫，你找到我啦",
  "我刚吃饱，有点懒懒的",
  "泡泡破了也没关系，我再吹一个",
  "你好呀",
  "我想听你讲今天都干什么啦",
  "摸一下，电量 +1",
  "今天的水特别清澈",
  "被夸的时候也会脸红哦",
  "我捡到水里的星星啦",
  "摸摸鱼，疲惫消失",
  "你忙完记得回来找我",
  "小憩五分钟",
  "世界很大，我们一起去看看",
  "今天也要开开心心的",
  "你已经很棒啦",
  "晚上见，做个好梦",
  "我在晒太阳，很舒服",
  "我听见你笑了一下",
  "{鱼}也有大梦想",
  "今日份可爱已送达",
  "我在荷叶下面呢",
  "忙完记得吃东西",
  "我把星星串成一串送给你",
  "明天的事明天再说",
  "摸摸鱼，今天圆满啦",
  "今日状态：软乎乎",
  "烦恼先放岸上吧",
  "给自己一个小奖励吧",
  "我捡到一块圆圆的石头",
  "我把日落装进水里啦",
  "摸摸鱼，万事顺顺的",
  "咕噜，被摸到了",
  "好久不见。",
] as const;

const QUEUE_KEY = "momoyu.fish.lines.queue";

function shuffleIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function readQueue(): number[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is number =>
        typeof i === "number" && Number.isInteger(i) && i >= 0 && i < FISH_LINES.length
    );
  } catch {
    return [];
  }
}

/** 取下一条弹幕：当前轮用完后重新打乱开下一轮，每轮每条只出一次 */
export function nextFishLine(fishName = "Memo"): string {
  let queue = readQueue();
  if (queue.length === 0) {
    queue = shuffleIndices(FISH_LINES.length);
  }
  const index = queue.pop()!;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  const name = (fishName || "").trim() || "Memo";
  return FISH_LINES[index]!.replaceAll("{鱼}", name);
}
