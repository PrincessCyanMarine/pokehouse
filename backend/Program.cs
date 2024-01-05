// Filename:  HttpServer.cs        
// Author:    Benjamin N. Summerton <define-private-public>        
// License:   Unlicense (http://unlicense.org/)

using System;
using System.IO;
using System.Text;
using System.Net;
using System.Threading.Tasks;
using System.Text.Json;
using PKHeX.Core;
using System.Reflection;
using Newtonsoft.Json;

namespace PokemonHouse
{
    public static class PKMConverter
    {
        public static Dictionary<string, string>? PKMToJSON(PKM pkm)
        {
            var pkmInfo = new Dictionary<string, string>();
            if (pkm != null)
            {
                foreach (var p in pkm.GetType().GetProperties().Where(p =>
                {
                    var getter = p.GetGetMethod();
                    if (getter == null)
                        return false;
                    if (getter.ReturnType == typeof(Func<>))
                        return false;

                    return !getter.GetParameters().Any();
                }))
                {
                    try
                    {
                        if (p != null)
                        {
                            var value = p.GetValue(pkm);
                            pkmInfo.Add(p.Name, value == null ? "" : value.ToString());
                        }
                    }
                    catch { }
                }

            }
            else
            {

            }
            pkmInfo["Type"] = pkm.GetType().Name;
            return pkmInfo;
        }
        public static Dictionary<string, string>? SAVToJSON(SaveFile sav)
        {
            var savInfo = new Dictionary<string, string>();
            if (sav != null)
            {
                foreach (var s in sav.GetType().GetProperties().Where(s =>
                {
                    var getter = s.GetGetMethod();
                    if (getter == null)
                        return false;
                    if (getter.ReturnType == typeof(Func<>))
                        return false;

                    return !getter.GetParameters().Any();
                }))
                    try
                    {
                        if (s != null)
                        {
                            var value = s.GetValue(sav);
                            if (value == "BoxData") continue;
                            savInfo.Add(s.Name, value == null ? "" : value.ToString());
                        }
                    }
                    catch { }
            }
            else
            {

            }

            savInfo["PokeDex"] = System.Text.Json.JsonSerializer.Serialize(sav.GetLivingDex().Select(pkm => PKMConverter.PKMToJSON(pkm)));
            savInfo["PKMType"] = sav.PKMType.Name;
            return savInfo;

        }
    }



    public static class HttpServer
    {
        public static HttpListener listener;
        public static string url = "http://localhost:8080/";
        public static string HomePath = "../home/";
        public static int pageViews = 0;
        public static int requestCount = 0;
        // public static string pageData =


        public static async Task HandleIncomingConnections()
        {
            bool runServer = true;

            // While a user hasn't visited the `shutdown` url, keep on handling requests
            while (runServer)
            {
                // Will wait here until we hear from a connection
                HttpListenerContext ctx = await listener.GetContextAsync();

                // Peel out the requests and response objects
                HttpListenerRequest req = ctx.Request;
                HttpListenerResponse resp = ctx.Response;

                // Print out some info about the request
                // Console.WriteLine("Request #: {0}", ++requestCount);
                Console.WriteLine(req.Url.ToString());
                // Console.WriteLine(req.HttpMethod);
                // Console.WriteLine(req.UserHostName);
                // Console.WriteLine(req.UserAgent);
                string text;
                using (var reader = new StreamReader(req.InputStream,
                                                     req.ContentEncoding))
                {
                    text = reader.ReadToEnd();
                }

                Console.WriteLine(text.ToString());
                Console.WriteLine();

                // If `shutdown` url requested w/ POST, then shutdown the server after serving the page


                // Make sure we don't increment the page views counter if `favicon.ico` is requested
                if (req.Url.AbsolutePath != "/favicon.ico")
                    pageViews += 1;
                if (req.HttpMethod == "OPTIONS")
                {
                    resp.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
                    resp.AddHeader("Access-Control-Allow-Methods", "GET, POST");
                    resp.AddHeader("Access-Control-Max-Age", "1728000");
                }
                resp.AppendHeader("Access-Control-Allow-Origin", "*");

                byte[] data;
                Console.WriteLine(req.Url.AbsolutePath);
                if (req.Url.AbsolutePath == "/shutdown")
                {
                    Console.WriteLine("Shutdown requested");
                    runServer = false;
                    data = Encoding.UTF8.GetBytes("Server shutting down");
                }
                else
                    data = Encoding.UTF8.GetBytes($"<html><head><title>HttpListener Example</title></head><body><h1>HttpListener Example</h1><p>Page Views: {pageViews}</p><form method='post' action='/shutdown'><input type='submit' value='Shutdown Server'></form></body></html>");

                if (req.Url.AbsolutePath != "/shutdown")
                {

                    // Write the response info
                    try
                    {
                        if ((req.HttpMethod == "POST"))
                        {
                            var inputData = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, dynamic?>>(text);
                            if (inputData != null)
                            {
                                switch ((req.Url.AbsolutePath))
                                {
                                    case "/sav/get":
                                        {
                                            string? path = GetInputData(inputData, "path", JsonValueKind.String)?.GetString();
                                            if (path == null)
                                            {
                                                resp.StatusCode = 400;
                                                data = Encoding.UTF8.GetBytes("No save file path provided");
                                                break;
                                            }
                                            bool isHome = path.ToLower() == "home";
                                            if (isHome)
                                            {
                                                Dictionary<string, string>? fakeHomeSav = PKMConverter.SAVToJSON(new SAV9SV());
                                                if (fakeHomeSav == null)
                                                {
                                                    resp.StatusCode = 400;
                                                    data = Encoding.UTF8.GetBytes("Failed to create fake home save file");
                                                    break;
                                                }
                                                fakeHomeSav["BoxCount"] = "3840";
                                                string[] fakeBoxNames = new string[3840];
                                                for (int i = 0; i < 3840; i++)
                                                    fakeBoxNames[i] = CreateRandomBoxName(i + 1);
                                                fakeHomeSav["BoxNames"] = JsonConvert.SerializeObject(fakeBoxNames);
                                                fakeHomeSav["PartyData"] = JsonConvert.SerializeObject(new Dictionary<string, string>[6]);
                                                data = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(fakeHomeSav);
                                                break;
                                            }
                                            SaveFile? sav = SaveUtil.GetVariantSAV(path);
                                            if (sav == null)
                                            {
                                                resp.StatusCode = 400;
                                                data = Encoding.UTF8.GetBytes("Failed to load save file");
                                                break;
                                            }
                                            dynamic? convertedSav = PKMConverter.SAVToJSON(sav);
                                            if (convertedSav == null)
                                            {
                                                resp.StatusCode = 400;
                                                data = Encoding.UTF8.GetBytes("Failed to convert SAV to JSON");
                                                break;
                                            }

                                            string[]? boxNames = new string[sav.BoxCount];
                                            for (int i = 0; i < sav.BoxCount; i++)
                                                boxNames[i] = sav.GetBoxName(i);
                                            convertedSav["BoxNames"] = JsonConvert.SerializeObject(boxNames);
                                            Dictionary<string, string>?[] party = new Dictionary<string, string>[6];
                                            for (int i = 0; i < 6; i++)
                                                party[i] = PKMConverter.PKMToJSON(sav.GetPartySlotAtIndex(i));
                                            convertedSav["PartyData"] = JsonConvert.SerializeObject(party);

                                            data = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(convertedSav);
                                        }
                                        break;
                                    case "/pkm/get":
                                    case "/box/get":
                                        {
                                            string? path = GetInputData(inputData, "path", JsonValueKind.String)?.GetString();
                                            int? pos = GetInputData(inputData, "boxPos", JsonValueKind.Number)?.GetInt32();
                                            int? boxNum = GetInputData(inputData, "boxNum", JsonValueKind.Number)?.GetInt32();
                                            if (path != null)
                                            {
                                                IList<PKM>? box = null;
                                                SaveFile? sav = null;
                                                bool isHome = path.ToLower() == "home";
                                                if (!isHome)
                                                {
                                                    sav = SaveUtil.GetVariantSAV(path);
                                                    if (sav != null)
                                                    {
                                                        box = sav.BoxData;
                                                        if (boxNum != null)
                                                            box = box.Skip(((int)boxNum % sav.BoxCount) * 30 - 1).Take(30).ToArray();
                                                    }
                                                }
                                                else if (isHome)
                                                    box = GetPKMAtHome();
                                                if (box == null)
                                                {
                                                    data = Encoding.UTF8.GetBytes("Failed to load box");
                                                    break;
                                                }
                                                dynamic? convertedBox;
                                                int BoxSlotCount = sav?.BoxSlotCount ?? 30;
                                                if (pos != null)
                                                {
                                                    convertedBox = PKMConverter.PKMToJSON(pos < 0 ? sav.GetPartySlotAtIndex(((int)pos! * -1) - 1) : box[((int)pos!) % (BoxSlotCount)]);
                                                }
                                                else
                                                    convertedBox = box.Select(pkm => PKMConverter.PKMToJSON(pkm)).ToArray();
                                                if (convertedBox == null)
                                                {
                                                    data = Encoding.UTF8.GetBytes("Failed to convert PKM to JSON");
                                                    break;
                                                }
                                                data = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(convertedBox);

                                                // Console.WriteLine("Failed to load save file");
                                            }
                                            else
                                            {
                                                data = Encoding.UTF8.GetBytes("No path provided");
                                            }

                                        }
                                        break;
                                    case "/pkm/swap":
                                    case "/pkm/move":
                                        {
                                            bool swap = req.Url.AbsolutePath == "/pkm/swap";
                                            JsonElement? from = GetInputData(inputData, "from", JsonValueKind.Object);
                                            JsonElement? to = GetInputData(inputData, "to", JsonValueKind.Object);
                                            if (from == null || to == null)
                                            {
                                                data = Encoding.UTF8.GetBytes("Missing parameters");
                                                break;
                                            }
                                            string? fromPath = from != null ? GetInputData((JsonElement)from, "path", JsonValueKind.String)?.GetString() : null;
                                            // int? fromPos = from != null ? GetInputData((JsonElement)from, "boxPos", JsonValueKind.Number)?.GetInt32() : null;
                                            int[]? fromPosList = GetInputData((JsonElement)from, "boxPosList", JsonValueKind.Array)?.EnumerateArray().Select(e => e.GetInt32()).ToArray();
                                            string? toPath = to != null ? GetInputData((JsonElement)to, "path", JsonValueKind.String)?.GetString() : null;
                                            // int? toPos = to != null ? GetInputData((JsonElement)to, "boxPos", JsonValueKind.Number)?.GetInt32() : null;
                                            int[]? toPosList = GetInputData((JsonElement)to, "boxPosList", JsonValueKind.Array)?.EnumerateArray().Select(e => e.GetInt32()).ToArray();
                                            if (fromPosList.Length != toPosList.Length)
                                            {
                                                data = Encoding.UTF8.GetBytes("Number of from and to positions must be equal");
                                                break;
                                            }
                                            if (fromPath != null && fromPosList != null && toPath != null && toPosList != null)
                                            {
                                                SaveFile? toSav = null;
                                                SaveFile? fromSav = null;
                                                SaveFile? sav = null;
                                                if (fromPath != toPath)
                                                {
                                                    fromSav = SaveUtil.GetVariantSAV(fromPath);
                                                    toSav = SaveUtil.GetVariantSAV(toPath);
                                                }
                                                else
                                                    sav = SaveUtil.GetVariantSAV(fromPath);
                                                for (int t = 0; t < toPosList.Length; t++)
                                                {
                                                    int toPos = toPosList[t];
                                                    int fromPos = fromPosList[t];
                                                    Console.WriteLine("Swapping/Moving " + fromPos + " of " + fromPath + " with " + toPos + " of " + toPath);
                                                    int ajnbejkbnmles = 0;
                                                    Console.WriteLine(ajnbejkbnmles++);
                                                    if (fromPath != toPath)
                                                    {
                                                        PKM? fromPkm = null;
                                                        PKM? toPkm = null;
                                                        bool fromHome = fromPath.ToLower() == "home";
                                                        bool toHome = toPath.ToLower() == "home";

                                                        if (swap && (fromHome || toHome))
                                                        {
                                                            resp.StatusCode = 418;
                                                            data = Encoding.UTF8.GetBytes("Cannot swap between save file and home");
                                                            break;
                                                        }

                                                        if (fromHome)
                                                        {
                                                            PKM[] homeBox = GetPKMAtHome();
                                                            fromPkm = fromPos >= homeBox.Length ? GetFakeHomePokemon() : homeBox[fromPos];
                                                        }
                                                        else
                                                        {
                                                            if (fromSav != null)
                                                                fromPkm = fromPos < 0 ? fromSav.GetPartySlotAtIndex(((int)fromPos * -1) - 1) : fromSav.GetBoxSlotAtIndex((int)fromPos);
                                                        }
                                                        Console.WriteLine(ajnbejkbnmles++);
                                                        if (toHome)
                                                        {
                                                            PKM[] homeBox = GetPKMAtHome();
                                                            Console.WriteLine("FromPos: " + toPos + " | HomeBoxLength: " + homeBox.Length);
                                                            toPkm = toPos >= homeBox.Length ? GetFakeHomePokemon() : homeBox[toPos];
                                                        }
                                                        else
                                                        {
                                                            if (toSav != null)
                                                                toPkm = toPos < 0 ? toSav.GetPartySlotAtIndex(((int)toPos * -1) - 1) : toSav.GetBoxSlotAtIndex((int)toPos);
                                                        }

                                                        if (fromPkm == null || toPkm == null)
                                                        {
                                                            data = Encoding.UTF8.GetBytes("Failed to load PKM");
                                                            break;
                                                        }

                                                        Console.WriteLine(ajnbejkbnmles++);
                                                        if (!swap && toPkm.Species != 0)
                                                        {
                                                            data = Encoding.UTF8.GetBytes("Target slot is not empty");
                                                            break;
                                                        }
                                                        var toToFromCR = new EntityConverterResult();
                                                        var fromTotoCR = new EntityConverterResult();

                                                        var fromType = fromPkm.GetType();
                                                        var toType = toPkm.GetType();

                                                        PKM? newFrom = toPkm;
                                                        PKM? newTo = fromPkm;

                                                        Console.WriteLine(ajnbejkbnmles++);
                                                        if (fromType != toType)
                                                        {
                                                            newFrom = EntityConverter.ConvertToType(toPkm, fromPkm.GetType(), out toToFromCR);
                                                            if (!toHome)
                                                                newTo = EntityConverter.ConvertToType(fromPkm, toPkm.GetType(), out fromTotoCR);
                                                            if ((swap && !(!toToFromCR.IsSuccess() || newFrom == null)) || (!toHome && !fromTotoCR.IsSuccess()) || newTo == null)
                                                            {
                                                                resp.StatusCode = 418;
                                                                data = Encoding.UTF8.GetBytes("Failed to convert between games");
                                                                break;
                                                            }
                                                        }
                                                        if (!swap || newFrom == null) newFrom = fromSav?.BlankPKM;

                                                        Console.WriteLine(ajnbejkbnmles++);
                                                        if (!fromHome)
                                                        {
                                                            ConvertToRegion(newFrom, fromSav);
                                                            newFrom.ClearInvalidMoves();
                                                            if (fromPos < 0)
                                                                fromSav.SetPartySlotAtIndex(newFrom, ((int)fromPos * -1) - 1);
                                                            else
                                                                fromSav.SetBoxSlotAtIndex(newFrom, (int)fromPos);
                                                        }
                                                        else
                                                            RemovePKMFromHome((int)fromPos);
                                                        if (!toHome)
                                                        {
                                                            ConvertToRegion(newTo, toSav);
                                                            newTo.ClearInvalidMoves();
                                                            if (toPos < 0)
                                                                toSav.SetPartySlotAtIndex(newTo, ((int)toPos * -1) - 1);
                                                            else
                                                                toSav.SetBoxSlotAtIndex(newTo, (int)toPos);
                                                        }
                                                        else
                                                        {
                                                            if (toPos == null) toPos = -1;
                                                            AddPKMToHome(newTo, (int)toPos!);
                                                        }

                                                        Console.WriteLine(ajnbejkbnmles++);
                                                        data = Encoding.UTF8.GetBytes("Swapped between save files");
                                                    }
                                                    else
                                                    {
                                                        bool isHome = fromPath == "home";
                                                        PKM? toPkm = null;
                                                        PKM? fromPkm = null;
                                                        if (!isHome)
                                                        {
                                                            if (sav != null)
                                                            {
                                                                fromPkm = fromPos < 0 ? sav.GetPartySlotAtIndex(((int)fromPos * -1) - 1) : sav.GetBoxSlotAtIndex((int)fromPos);
                                                                toPkm = toPos < 0 ? sav.GetPartySlotAtIndex(((int)toPos * -1) - 1) : sav.GetBoxSlotAtIndex((int)toPos);
                                                            }
                                                        }
                                                        else
                                                        {
                                                            PKM[] homeBox = GetPKMAtHome();
                                                            fromPkm = fromPos >= homeBox.Length ? GetFakeHomePokemon() : homeBox[fromPos];
                                                            if (swap)
                                                                toPkm = toPos >= homeBox.Length ? GetFakeHomePokemon() : homeBox[toPos];
                                                        }
                                                        if (fromPkm == null)
                                                        {
                                                            data = Encoding.UTF8.GetBytes("Failed to load PKM");
                                                            break;
                                                        }
                                                        if (!swap && toPkm != null && toPkm?.Species != 0)
                                                        {
                                                            data = Encoding.UTF8.GetBytes("Target slot is not empty");
                                                            break;
                                                        }
                                                        if (!isHome)
                                                        {
                                                            if (sav == null)
                                                            {
                                                                data = Encoding.UTF8.GetBytes("Failed to load save file");
                                                                break;
                                                            }
                                                            if (!swap) toPkm = sav.BlankPKM;
                                                            fromPkm.ClearInvalidMoves();
                                                            if (toPos < 0)
                                                                sav.SetPartySlotAtIndex(fromPkm, ((int)toPos * -1) - 1);
                                                            else
                                                                sav.SetBoxSlotAtIndex(fromPkm, (int)toPos);
                                                            if (toPkm != null)
                                                            {
                                                                toPkm.ClearInvalidMoves();
                                                                if (fromPos < 0)
                                                                    sav.SetPartySlotAtIndex(toPkm, ((int)fromPos * -1) - 1);
                                                                else
                                                                    sav.SetBoxSlotAtIndex(toPkm, (int)fromPos);
                                                            }
                                                        }
                                                        else
                                                        {
                                                            AddPKMToHome(toPkm, (int)fromPos);
                                                            AddPKMToHome(fromPkm, (int)toPos);
                                                            // if (!swap && fromPos != null) RemovePKMFromHome((int)toPos!);
                                                            // if (swap && (toPkm == null || toPkm.Species == 0))
                                                            //     RemovePKMFromHome((int)fromPos!);
                                                            // if (swap && (fromPkm == null || fromPkm.Species == 0)) RemovePKMFromHome((int)fromPos!);
                                                        }
                                                        data = Encoding.UTF8.GetBytes("Swapped within save file");
                                                    }
                                                }
                                                if (fromPath != toPath)
                                                {
                                                    if (fromPath != "home" && fromSav != null)
                                                        File.WriteAllBytes(fromPath, fromSav.Write());
                                                    if (toPath != "home" && toSav != null)
                                                        File.WriteAllBytes(toPath, toSav.Write());
                                                }
                                                else if (fromPath != "home" && sav != null)
                                                    File.WriteAllBytes(fromPath, sav.Write());


                                            }
                                        }
                                        break;
                                    case "/box/size":
                                    case "/box/count":
                                        {
                                            var path = GetInputData(inputData, "path", JsonValueKind.String)?.GetString();
                                            if (path == null)
                                            {
                                                data = Encoding.UTF8.GetBytes("No save file path provided");
                                                break;
                                            }
                                            var sav = SaveUtil.GetVariantSAV(path);
                                            if (sav == null)
                                            {
                                                data = Encoding.UTF8.GetBytes("Failed to load save file");
                                                break;
                                            }
                                            switch (req.Url.AbsolutePath)
                                            {
                                                case "/box/size":
                                                    data = Encoding.UTF8.GetBytes(sav.BoxSlotCount.ToString());
                                                    break;
                                                case "/box/count":
                                                    data = Encoding.UTF8.GetBytes(sav.BoxCount.ToString());
                                                    break;
                                            }
                                        }
                                        break;

                                    case "/compatible":
                                        {
                                            int? from = GetInputData(inputData, "from", JsonValueKind.Number)?.GetInt32();
                                            int? to = GetInputData(inputData, "to", JsonValueKind.Number)?.GetInt32();
                                            if (from == null || to == null)
                                            {
                                                data = Encoding.UTF8.GetBytes("Missing parameters");
                                                break;
                                            }
                                            var c = isCompatible((int)from!, (int)to!);
                                            data = Encoding.UTF8.GetBytes(c.ToString());
                                        }
                                        break;
                                }
                            }
                            else
                            {
                                data = Encoding.UTF8.GetBytes("No save file path provided");
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e);
                        data = Encoding.UTF8.GetBytes("Something went wrong");
                    }
                }


                resp.ContentType = "text/html";
                resp.ContentEncoding = Encoding.UTF8;
                resp.ContentLength64 = data.LongLength;

                if (data.LongLength < 500)
                    Console.WriteLine("Sending " + Encoding.UTF8.GetString(data));

                // Write out to the response stream (asynchronously), then close it
                try
                {
                    await resp.OutputStream.WriteAsync(data, 0, data.Length);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }
                finally
                {
                    resp.Close();
                }

            }
        }


        public static void Main(string[] args)
        {
            // Create a Http server and start listening for incoming connections
            listener = new HttpListener();
            listener.Prefixes.Add(url);
            listener.Start();
            Console.WriteLine("Backend server is listening for connections on {0}", url);

            // Handle requests
            Task listenTask = HandleIncomingConnections();
            listenTask.GetAwaiter().GetResult();

            // Close the listener
            listener.Close();
        }

        public static JsonElement? GetInputData(JsonElement inputData, string key, JsonValueKind valueKind)
        {
            JsonElement? value;
            JsonElement? posElem = inputData.GetProperty(key);
            if (posElem.Value.ValueKind != valueKind)
            {
                value = null;
            }
            else
            {
                value = posElem.Value;
            }
            return value;
        }

        public static bool HasProperty(this object objectToCheck, string methodName)
        {
            var type = objectToCheck.GetType();
            return type.GetProperty(methodName) != null;
        }

        public static JsonElement? GetInputData(Dictionary<string, dynamic?> inputData, string key, JsonValueKind valueKind)
        {
            JsonElement? value;
            JsonElement? posElem = inputData.GetValueOrDefault(key, null);
            if (posElem == null || (posElem.Value.ValueKind != valueKind))
            {
                value = null;
            }
            else
            {
                value = posElem.Value;
            }
            return value;
        }

        public static PKM ConvertToRegion(PKM pkm, SaveFile sav)
        {
            // Console.WriteLine("Country: " + HasProperty(sav, "Country"));
            // Console.WriteLine("ConsoleRegion: " + HasProperty(sav, "ConsoleRegion"));
            // Console.WriteLine("Region: " + HasProperty(sav, "Region"));
            if (HasProperty(sav, "Country"))
                ((dynamic)pkm).Country = ((dynamic)sav).Country;
            if (HasProperty(sav, "ConsoleRegion"))
                ((dynamic)pkm).ConsoleRegion = ((dynamic)sav).ConsoleRegion;
            if (HasProperty(sav, "Region"))
                ((dynamic)pkm).Region = ((dynamic)sav).Region;
            return pkm;
        }

        public static bool isCompatible(int from, int to)
        {
            if (from >= 3 && from > to && to < 8)
            {
                return false;
            }

            if (from <= 2 && to > 2 && to < 7)
            {
                return false;
            }

            return true;
        }

        public static void RemovePKMFromHome(int pos)
        {
            File.Delete(HomePath + pos);
        }

        public static bool AddPKMToHome(PKM? pkm, int pos = -1)
        {
            Console.WriteLine("Adding " + pkm?.FileName + " to " + pos);
            // if (File.Exists(HomePath + pos)) return false;
            if (pkm == null || pkm.Species == 0)
            {
                RemovePKMFromHome(pos);
                return false;
            }
            if (pos == -1)
            {
                int i = 0;
                while (File.Exists(HomePath + i))
                    i++;
                pos = i;
            }
            File.WriteAllBytes(HomePath + pos, pkm.Data);
            return true;
        }

        public static PK9 GetFakeHomePokemon()
        {
            PK9 fakeMon = new PK9();
            fakeMon.Species = 0;
            fakeMon.Nickname = "Empty";
            fakeMon.OT_Name = "Empty";
            return fakeMon;
        }

        public static PKM[] GetPKMAtHome()
        {
            Directory.CreateDirectory(HomePath);
            DirectoryInfo dir = new DirectoryInfo(HomePath);
            FileInfo[] files = dir.GetFiles("*");
            int homeSize = 30 * 64;
            int latestPos = 0;
            for (int i = 0; i < files.Length; i++) if (int.Parse(files[i].Name) > latestPos) latestPos = int.Parse(files[i].Name);
            homeSize = Math.Max(((int)Math.Ceiling((double)(latestPos) / 30.0) + 5) * 30, homeSize);
            Console.WriteLine("Files length: " + latestPos + " Home size: " + homeSize);
            PKM[] box = new PKM[homeSize];
            for (int i = 0; i < files.Length; i++)
            {
                int pos = int.Parse(files[i].Name);
                box[pos] = EntityFormat.GetFromBytes(File.ReadAllBytes(files[i].FullName));
            }
            for (int i = 0; i < homeSize; i++)
            {
                if (box[i] == null)
                    box[i] = GetFakeHomePokemon();
            }
            return box;
        }

        public static string CreateRandomBoxName(int i)
        {

            string[] names = new string[] {
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Box " + i,
                "Ash's Box " + i,
                "Misty's Box " + i,
                "Brock's Box " + i,
                "Gary's Box " + i,
                "Professor Oak's Box " + i,
                "Professor Elm's Box " + i,
                "Professor Birch's Box " + i,
                "Professor Rowan's Box " + i,
                "Professor Juniper's Box " + i,
                "Professor Sycamore's Box " + i,
                "Professor Kukui's Box " + i,
                "Professor Sonia's Box " + i,
                "Professor Willow's Box " + i,
                "Gary's Box " + i,
                "Red's Box " + i,
                "Blue's Box " + i,
                "Green's Box " + i,
                "Marine's Box " + i,
                "Cyan's Box " + i,
                "Your Box " + i,
                "My Box " + i,
                "Our Box " + i,
                "Their Box " + i,
                "His Box " + i,
                "Her Box " + i,
                "Its Box " + i,
                "Your Mom's Box " + i,
                "My Mom's Box " + i,
                "Someone's Box " + i,
                "Nobody's Box " + i,
                "Everybody's Box " + i,
                "Somebody's Box " + i,
                "Anybody's Box " + i,"Box " + i,
                "Ash's Box " + i,
                "Misty's Box " + i,
                "Brock's Box " + i,
                "Gary's Box " + i,
                "Professor Oak's Box " + i,
                "Professor Elm's Box " + i,
                "Professor Birch's Box " + i,
                "Professor Rowan's Box " + i,
                "Professor Juniper's Box " + i,
                "Professor Sycamore's Box " + i,
                "Professor Kukui's Box " + i,
                "Professor Sonia's Box " + i,
                "Professor Willow's Box " + i,
                "Gary's Box " + i,
                "Red's Box " + i,
                "Blue's Box " + i,
                "Green's Box " + i,
                "Marine's Box " + i,
                "Cyan's Box " + i,
                "Your Box " + i,
                "My Box " + i,
                "Our Box " + i,
                "Their Box " + i,
                "His Box " + i,
                "Her Box " + i,
                "Its Box " + i,
                "Your Mom's Box " + i,
                "My Mom's Box " + i,
                "Someone's Box " + i,
                "Nobody's Box " + i,
                "Everybody's Box " + i,
                "Somebody's Box " + i,
                "Anybody's Box " + i,"Box " + i,
                "Ash's Box " + i,
                "Misty's Box " + i,
                "Brock's Box " + i,
                "Gary's Box " + i,
                "Professor Oak's Box " + i,
                "Professor Elm's Box " + i,
                "Professor Birch's Box " + i,
                "Professor Rowan's Box " + i,
                "Professor Juniper's Box " + i,
                "Professor Sycamore's Box " + i,
                "Professor Kukui's Box " + i,
                "Professor Sonia's Box " + i,
                "Professor Willow's Box " + i,
                "Gary's Box " + i,
                "Red's Box " + i,
                "Blue's Box " + i,
                "Green's Box " + i,
                "Marine's Box " + i,
                "Cyan's Box " + i,
                "Your Box " + i,
                "My Box " + i,
                "Our Box " + i,
                "Their Box " + i,
                "His Box " + i,
                "Her Box " + i,
                "Its Box " + i,
                "Your Mom's Box " + i,
                "My Mom's Box " + i,
                "Someone's Box " + i,
                "Nobody's Box " + i,
                "Everybody's Box " + i,
                "Somebody's Box " + i,
                "Anybody's Box " + i,"Box " + i,
                "Ash's Box " + i,
                "Misty's Box " + i,
                "Brock's Box " + i,
                "Gary's Box " + i,
                "Professor Oak's Box " + i,
                "Professor Elm's Box " + i,
                "Professor Birch's Box " + i,
                "Professor Rowan's Box " + i,
                "Professor Juniper's Box " + i,
                "Professor Sycamore's Box " + i,
                "Professor Kukui's Box " + i,
                "Professor Sonia's Box " + i,
                "Professor Willow's Box " + i,
                "Gary's Box " + i,
                "Red's Box " + i,
                "Blue's Box " + i,
                "Green's Box " + i,
                "Marine's Box " + i,
                "Cyan's Box " + i,
                "Your Box " + i,
                "My Box " + i,
                "Our Box " + i,
                "Their Box " + i,
                "His Box " + i,
                "Her Box " + i,
                "Its Box " + i,
                "Your Mom's Box " + i,
                "My Mom's Box " + i,
                "Someone's Box " + i,
                "Nobody's Box " + i,
                "Everybody's Box " + i,
                "Somebody's Box " + i,
                "Anybody's Box " + i,
                "A Box",
                "The Box",
                "A?",
                "The?",
                "A Box?",
                "The Box?",
                "Is this a box?",
                "What is a box?",
                "What is this?",
                "Who are you?",
                "Who am I?",
                "Who are we?",
                "Who is anyone?",
                "Is there anyone?",
                "Is there a box?",
                "Is there a box here?",
                "Is someone there?",
                "Is anyone there?",
                "Help, I'm trapped in a box!",
            };
            return names[new Random().Next(names.Length)];
        }
    }
}