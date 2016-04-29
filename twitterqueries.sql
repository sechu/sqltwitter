SELECT CONTENT, NAME, PICTUREURL FROM TWEETS INNER JOIN USERS ON tweets.userid = users.id


.tweetbox img {
  float: left;
  height: 48px;
  width: 48px;
  content:url("http://lorempixel.com/48/48");
}