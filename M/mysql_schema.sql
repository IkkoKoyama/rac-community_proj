-- MySQL dump 10.13  Distrib 8.0.15, for osx10.14 (x86_64)
--
-- Host: localhost    Database: racco
-- ------------------------------------------------------
-- Server version	8.0.15

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8mb4 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clubs`
--

DROP TABLE IF EXISTS `clubs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `clubs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `district_id` int(10) DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `short_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `establish_date` datetime DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clubs`
--

LOCK TABLES `clubs` WRITE;
/*!40000 ALTER TABLE `clubs` DISABLE KEYS */;
INSERT INTO `clubs` VALUES (1,1,'東京ワセダローターアクトクラ部','東京ワセダ','waseda@gmail.com','https://google.com','2020-06-03 00:00:00','よろしくお願いしますßaaaaaaa','2020-04-18 01:05:41','2020-06-24 07:09:00'),(19,1,'地区','地区','','','2020-07-01 00:00:00','','2020-07-14 19:03:00','2020-07-14 10:03:00');
/*!40000 ALTER TABLE `clubs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `districts`
--

DROP TABLE IF EXISTS `districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `districts` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `districts`
--

LOCK TABLES `districts` WRITE;
/*!40000 ALTER TABLE `districts` DISABLE KEYS */;
INSERT INTO `districts` VALUES (1,'第2580地区','よろしくお願いします','2020-06-14 17:51:30','2020-06-19 20:00:10'),(2,'第2590地区',NULL,'2020-06-20 04:40:55','2020-06-19 19:40:55');
/*!40000 ALTER TABLE `districts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_comments`
--

DROP TABLE IF EXISTS `event_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `event_comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `event_id` bigint(20) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `event_comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_comments_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_comments`
--

LOCK TABLES `event_comments` WRITE;
/*!40000 ALTER TABLE `event_comments` DISABLE KEYS */;
INSERT INTO `event_comments` VALUES (13,2,19,'当日は14:00開始に変更になりました！','2020-06-20 08:35:38','2020-06-19 23:35:38'),(14,2,19,'当日は14:00開始に変更になりました！','2020-06-20 08:35:41','2020-06-19 23:35:41'),(15,2,19,'当日は14:00開始に変更になりました！','2020-06-20 22:11:23','2020-06-20 13:11:23'),(16,2,19,'よろしくお願いします','2020-06-20 23:58:30','2020-06-20 14:58:30'),(17,2,19,'afv','2020-06-23 14:59:10','2020-06-23 05:59:10'),(19,2,19,'afv','2020-07-21 22:42:48','2020-07-21 13:42:48'),(20,2,19,'!ucha!r_3!ucha!r_5$!ucha!r_6!ucha!r_0!ucha!r_4','2020-07-21 22:42:54','2020-07-21 13:42:54'),(21,2,19,'afd','2020-07-21 23:13:02','2020-07-21 14:13:02');
/*!40000 ALTER TABLE `event_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_likes`
--

DROP TABLE IF EXISTS `event_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `event_likes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `event_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `event_likes_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_likes`
--

LOCK TABLES `event_likes` WRITE;
/*!40000 ALTER TABLE `event_likes` DISABLE KEYS */;
INSERT INTO `event_likes` VALUES (115,19,2,'2020-06-20 08:34:06','2020-06-19 23:34:06'),(116,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(117,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(118,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(119,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(120,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(121,19,2,'2020-06-20 08:34:07','2020-06-19 23:34:07'),(122,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(123,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(124,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(125,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(126,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(127,19,2,'2020-06-20 08:34:08','2020-06-19 23:34:08'),(128,19,2,'2020-06-20 08:34:09','2020-06-19 23:34:09'),(129,19,2,'2020-06-20 08:34:09','2020-06-19 23:34:09'),(130,19,2,'2020-06-20 08:34:09','2020-06-19 23:34:09'),(131,19,2,'2020-06-20 08:34:09','2020-06-19 23:34:09'),(132,19,2,'2020-06-20 08:34:09','2020-06-19 23:34:09'),(133,19,2,'2020-06-20 08:34:10','2020-06-19 23:34:10'),(134,19,2,'2020-06-20 08:34:10','2020-06-19 23:34:10'),(135,19,2,'2020-06-20 08:34:10','2020-06-19 23:34:10'),(136,19,2,'2020-06-20 08:34:10','2020-06-19 23:34:10'),(137,19,2,'2020-06-20 08:34:10','2020-06-19 23:34:10'),(138,19,2,'2020-06-20 08:34:11','2020-06-19 23:34:11'),(139,19,2,'2020-06-20 08:34:11','2020-06-19 23:34:11'),(140,19,2,'2020-06-20 08:34:11','2020-06-19 23:34:11'),(141,19,2,'2020-06-20 08:34:11','2020-06-19 23:34:11'),(142,19,2,'2020-06-20 08:34:11','2020-06-19 23:34:11'),(143,19,2,'2020-06-20 08:34:12','2020-06-19 23:34:12'),(144,19,2,'2020-06-20 08:34:12','2020-06-19 23:34:12'),(145,19,2,'2020-06-20 08:34:13','2020-06-19 23:34:13'),(146,19,2,'2020-06-20 08:34:13','2020-06-19 23:34:13'),(147,19,2,'2020-06-22 14:49:04','2020-06-22 05:49:04'),(148,19,2,'2020-06-22 14:49:04','2020-06-22 05:49:04'),(149,19,2,'2020-06-22 14:49:05','2020-06-22 05:49:05'),(150,19,2,'2020-06-22 17:26:08','2020-06-22 08:26:08'),(151,19,2,'2020-06-22 17:26:08','2020-06-22 08:26:08');
/*!40000 ALTER TABLE `event_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `events` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sub_title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category_id` smallint(6) NOT NULL,
  `club_id` bigint(20) NOT NULL,
  `status` smallint(6) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,0) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `attachment` smallint(6) DEFAULT NULL,
  `addr` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `after_chil` int(6) DEFAULT NULL,
  `perti_type` int(6) DEFAULT NULL,
  `capacity` int(10) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lng` double DEFAULT NULL,
  `read_level` smallint(6) DEFAULT NULL,
  `date` datetime NOT NULL,
  `stime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `etime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `club_id` (`club_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (19,'aTITLEs','sub_titlea',1,1,1,'会長幹事各位ßßお世話になっております。ß東京浅草中央RAC 幹事の延澤です。ßß早速ではありますが、8月第二例会のご案内をさせていただきます。ß登録締め切りが 8月 9 日 (日)までと期限が短く恐縮ですが、ご確認いただけますと幸いです。ßß＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊ßß8月第2例会「カミナリオコシR ~夏のフォトジェニック~」ßß好評を博した、あの「カミナリオコシ」企画が帰ってきた！！？ß島田会長年度の企画をリスペクトしつつ、ß新要素：着付け体験が盛り込まれた企画となります。ßß国内外から訪れる観光客で連日賑わう東京の下町、浅草。ßロータリーファミリー（ROTEXや米山留学生）が訪れる機会も、少なくありません。ßß14:15 〜ß一部：浴衣の着付けß14:50 〜ß二部：ゆかたで浅草巡り 2020ß15:50 〜ß三部：飴細工制作体験ßß「なんか難しそう…」というイメージがある浴衣の着付け体験とß浅草の伝統工業でございます飴細工制作体験を行います。ßß＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊ßß◆例会詳細◆ß1.日時：2020年 8 月 16 日 (日) 14:00 ~ 18:00ß2.集合場所：雷門区民館（東京都台東区浅草1丁目37-3）ß3.集合時間：13:45ß4.参加費： RAC・ビジター：3,000円（体験教室代）/RC：4,000円ß※ 浴衣持参の方は、500円引きとさせていただきます。ß5.出欠期限： クラブ内で参加者を取りまとめいただき、ß8月 9 日 (日)までに東京浅草中央RAC 幹事 延澤までご連絡くださいませ。ßß【連絡先】ß宛先：東京浅草中央ローターアクトクラブ / 幹事 延澤儀明 (のべさわよしあき)ßE-mail：mm21.n0.n@gmail.comßß皆さまのご参加をお待ちしております！ßßQ !ucha!r_0 A.ßQ. 浴衣を持っていないのですが、参加は可能でしょうか？ßA. 可能です。私服のまま現地にお越しください。ßもし、浴衣をお持ちでなく、レンタルして浅草を散策したい場合は当クラブの連絡先へご相談ください。',0,'2021-07-16 00:00:00',1,'東京都東村山市市廻田町2-26-32',1,2,0,35.7535064,139.4474544,1,'2021-01-29 00:00:00','12:30','21:00','2020-06-20 08:33:22','2020-08-06 18:15:15');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registers`
--

DROP TABLE IF EXISTS `registers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `registers` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `event_id` bigint(20) NOT NULL,
  `at` int(6) DEFAULT NULL,
  `pt` int(6) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `registers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `registers_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registers`
--

LOCK TABLES `registers` WRITE;
/*!40000 ALTER TABLE `registers` DISABLE KEYS */;
INSERT INTO `registers` VALUES (8,6,19,2,2,'2020-06-24 14:21:52','2020-06-24 06:43:43');
/*!40000 ALTER TABLE `registers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `kana` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `user_level` smallint(6) NOT NULL,
  `club_id` bigint(6) NOT NULL,
  `position` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `job` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `birth` datetime DEFAULT NULL,
  `join_year` smallint(6) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `club_id` (`club_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'IKKO KOYAMA','こやま いっこう','tantric.nuts@gmail.com','$2b$10$dlrqIcLpvFOOMxiAQKtBeO.JeLXehfNSVKKbXZWJSiBOPdljeFEVW','!ucha!r_3!ucha!r_5!ucha!r_5!ucha!r_3ßああああ「',1,1,'専門能力開発委員〜長','攻殻機動隊小学生','0001-01-01 00:00:00',2015,'2020-04-18 05:44:23','2020-08-17 09:32:25'),(6,'サンプル太郎','サンプル太郎','sample@gmail.com','$2b$10$Y.yOPfQcEKlArBaNjHK4lOeNGYAbUcbRZlpUoAMzU8ZcpZJvGnb0i',NULL,6,1,'samplela',NULL,NULL,NULL,'2020-04-19 06:05:28','2020-06-24 06:57:26'),(18,'afdv','dv','tantric_nuts@yahoo.co.jp','$2b$10$KFmDmqAjFxUdInapwSztDudIFu.V8usDh32vv3wFZMZGBCmnX0hRS',NULL,6,1,'adfv',NULL,NULL,NULL,'2020-06-22 15:42:11','2020-06-24 04:17:12');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-08-21 15:02:26
