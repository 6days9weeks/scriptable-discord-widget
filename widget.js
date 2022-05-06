// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
const BOT_TOKEN = ""; // Your bot token from discord.dev
const GUILD_ID = ""; // The ID of the guild you want to show messages from.
const CHANNEL_ID = ""; // Channel ID needs to be a channel in the guild specified in `GUILD_ID`

async function fetchAvatarImage(user, member) {
  let url;
  if (member && member.avatar) {
    url = `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${user.id}/avatars/${member.avatar}.png`;
  } else if (user.avatar) {
    url = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  } else {
    url = `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator % 5)}.png`;
  }

  const request = new Request(url);
  return Image.fromData(await request.load());
}

async function fetchRecentMessage() {
  const request = new Request(`https://discord.com/api/v9/channels/${CHANNEL_ID}/messages?limit=1`);
  request.headers = {
    "user-agent": "DiscordBot(Scriptable iOS Widget, https://scriptable.app)",
    "authorization": `Bot ${BOT_TOKEN}`,
  };
  const data = await request.loadJSON().then(e => e[0]);
  data.member = await fetchMember(data.author.id);
  data.avatarImage = await fetchAvatarImage(data.author, data.member);
  return data;
}

async function fetchChannel() {
  const request = new Request(`https://discord.com/api/v9/channels/${CHANNEL_ID}`);
  request.headers = {
    "user-agent": "DiscordBot(Scriptable iOS Widget, https://scriptable.app)",
    "authorization": `Bot ${BOT_TOKEN}`,
  };
  const data = await request.loadJSON();
  return data;
}

async function fetchMember(id) {
  const request = new Request(`https://discord.com/api/v9/guilds/${GUILD_ID}/members/${id}`);
  request.headers = {
    "user-agent": "DiscordBot(Scriptable iOS Widget, https://scriptable.app)",
    "authorization": `Bot ${BOT_TOKEN}`,
  };
  const data = await request.loadJSON();
  return data;
}

function isoToRelative(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff > (1000 * 60 * 60 * 24 * 2)) {
    return date.toLocaleDateString();
  } else {
    const time = date.toLocaleTimeString();
    let [hours, minutes] = time.split(":");
    hours = Number(hours);
    minutes = Number(minutes);
    if (time.endsWith("PM")) {
      hours += 12;
    }
    hours = String(hours);
    minutes = String(minutes);
    const dt = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    return `${diff < (1000 * 60 * 60 * 24) ? "Today" : "Yesterday"} at ${dt}`;
  }
}
function createWidget(channel, msg) {
  const widget = new ListWidget();
  
  widget.backgroundColor = new Color("#36393F");
  widget.url = `https://discord.com/channels/${GUILD_ID}/${CHANNEL_ID}`;
  widget.spacing = 8;
  widget.refreshAfterDate = new Date();

  const channelInfo = widget.addText(`In #${channel.name}`);
  channelInfo.font = Font.systemFont(15);
  channelInfo.color = new Color("#FAFAFA");

  const messageStack = widget.addStack();
  messageStack.spacing = 8;
  const avatarImage = messageStack.addImage(msg.avatarImage);
  const sides = 38;
  avatarImage.imageSize = new Size(sides, sides);
  avatarImage.cornerRadius = sides / 2;

  const innerStack = messageStack.addStack();
  innerStack.layoutVertically();
  
  const messageInfoStack = innerStack.addStack();
  messageInfoStack.spacing = 8;

  const username = messageInfoStack.addText(msg.author.username);
  username.color = new Color("#FFFFFF");
  username.font = Font.systemFont(18);

  const timestamp = messageInfoStack.addText(isoToRelative(msg.timestamp));
  timestamp.color = new Color("#70747B");
  timestamp.font = Font.systemFont(15);

  let content;
  if (msg.content) {
    content = msg.content;
    if (msg.edited_timestamp) {
      content += ` (edited)`;
    }
  } else if (msg.attachments.length > 0) {
    content = `[${msg.attachments.length} attachments]`;
  } else if (msg.embeds.length > 0) {
    content = `[${msg.embeds.length} embeds]`;
  } else {
    content = "[No content]";
  }

  content = innerStack.addText(content);
  content.color = new Color("#FFFFFF");
  content.font = Font.systemFont(14);

  return widget;
}

const [channel, msg] = await Promise.all([fetchChannel(), fetchRecentMessage()]);
const widget = createWidget(channel, msg);

if (config.runsInApp) {
  widget.presentMedium();
} else {
  Script.setWidget(widget);
}
Script.complete();
