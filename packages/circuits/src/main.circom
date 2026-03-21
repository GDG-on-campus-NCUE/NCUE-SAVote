pragma circom 2.0.0;

// 引入你剛剛寫好的乾淨版 vote.circom
include "vote.circom";

// 實體化電路 (注意：因為我們把 public input 拿掉了，所以這裡直接宣告就好)
component main = Vote();