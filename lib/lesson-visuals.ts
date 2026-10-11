export type PhotoKey = 'cafe'|'groceries'|'delivery'|'cinema'|'classroom'|'library'|'transport'|'music'|'printing'|'meeting'|'planning'|'support';
export type VisualCell = {label:string;value:string;active?:boolean};
export type VisualRow = {label:string;cells:VisualCell[];linked?:boolean};
export type VisualNetwork = {nodes:{id:string;label:string;x:number;y:number;active?:boolean}[];edges:[string,string][]};
export type VisualFrame = {title:string;text:string;code:string;rows:VisualRow[];note?:string;network?:VisualNetwork};
export type LessonVisual = {photo:PhotoKey;caption:string;connections:[string,string][];frames:VisualFrame[]};

const values=(label:string,items:(string|number)[],active:number[]=[],labels?:string[],linked=false):VisualRow=>({label,linked,cells:items.map((value,i)=>({label:labels?.[i]??String(i),value:String(value),active:active.includes(i)}))});
const named=(label:string,items:[string,string|number][],active:number[]=[]):VisualRow=>({label,cells:items.map(([name,value],i)=>({label:name,value:String(value),active:active.includes(i)}))});
const frame=(title:string,text:string,code:string,rows:VisualRow[],note?:string):VisualFrame=>({title,text,code,rows,note});
const lesson=(photo:PhotoKey,caption:string,connections:[string,string][],frames:VisualFrame[]):LessonVisual=>({photo,caption,connections,frames});
const tree=(labels:[string,string,string],active:string[]=[]):VisualNetwork=>({nodes:[{id:'root',label:labels[0],x:300,y:36},{id:'left',label:labels[1],x:150,y:150},{id:'right',label:labels[2],x:450,y:150}].map(n=>({...n,active:active.includes(n.id)})),edges:[['root','left'],['root','right']]});

export const lessonVisuals:Record<string,LessonVisual>={
 'variables':lesson('cafe','An order has several kinds of information. Give each value its own named place in memory.',[
  ['Sandwich count','int quantity'],['Price of one sandwich','double price'],['Takeaway: yes or no','boolean takeaway']
 ],[
  frame('Give the values names','Store the count, price, and takeaway choice. A type describes which kind of value a variable can hold.','int quantity = 3;\ndouble price = 40.5;\nboolean takeaway = true;',[named('Stored variables',[['quantity · int',3],['price · double',40.5],['takeaway · boolean','true']],[0,1,2])]),
  frame('Calculate the first total','Multiply the values currently stored in quantity and price: 3 × 40.5 = 121.5.','double total = quantity * price;',[named('Order',[['quantity',3],['price',40.5],['total',121.5]],[2])]),
  frame('Add one sandwich','The assignment changes quantity to 4. total still holds 121.5; Java does not automatically recalculate it.','quantity = quantity + 1;',[named('After the assignment',[['quantity',4],['price',40.5],['total',121.5]],[0])]),
  frame('Recalculate using the new value','Run the multiplication again. Four sandwiches now cost Rs 162.0.','total = quantity * price;',[named('Updated order',[['quantity',4],['price',40.5],['total','162.0']],[2])])
 ]),
 'input-output':lesson('cinema','A ticket booking becomes useful when the program can read the request and print a confirmation.',[
  ['Name on the booking','nextLine() reads text'],['Number of seats','nextInt() reads an integer'],['Booking confirmation','println() prints a line']
 ],[
  frame('Start with two input lines','This example supplies fixed text to Scanner: a name on line 1 and a number on line 2.','String booking = "Meena\\n3\\n";\nScanner input = new Scanner(booking);',[named('Input text',[['line 1','Meena'],['line 2',3]])]),
  frame('Read the name','nextLine() consumes the first line and stores it as a String.','String name = input.nextLine();',[named('Read values',[['name','Meena'],['tickets','not read yet']],[0])]),
  frame('Read the ticket count','nextInt() consumes the number 3 as an int.','int tickets = input.nextInt();',[named('Read values',[['name','Meena'],['tickets',3]],[1])]),
  frame('Print the confirmation','Join the values with readable text, then send the message to output.','System.out.println(name + " booked " + tickets + " tickets.");',[named('Printed line',[['output','Meena booked 3 tickets.']],[0])],'To type your own input, change the Scanner source to System.in in Playground.')
 ]),
 'operators':lesson('cafe','Splitting a café bill shows why the quotient and remainder answer different questions.',[
  ['Equal whole-rupee share','bill / friends'],['Money still unpaid','bill % friends'],['Did it divide exactly?','remainder == 0']
 ],[
  frame('Set up the split','The bill is Rs 250 and there are 3 friends. Both values are integers.','int bill = 250;\nint friends = 3;',[named('Inputs',[['bill',250],['friends',3]])]),
  frame('Divide into whole shares','Integer division gives 83. Three payments of 83 cover Rs 249.','int share = bill / friends;',[named('Equal payments',[['friend 1',83],['friend 2',83],['friend 3',83]],[0,1,2])]),
  frame('Keep the remainder','250 − 249 leaves Rs 1. The % operator calculates this remainder.','int remainder = bill % friends;',[named('Bill check',[['covered',249],['remaining',1]],[1])]),
  frame('Compare with zero','The remainder is 1, so remainder == 0 evaluates to false. Equality uses ==, not assignment =.','System.out.println(remainder == 0);',[named('Comparison',[['1 == 0','false']],[0])])
 ]),
 'conditions':lesson('delivery','A delivery policy becomes a decision: choose the branch whose condition is true.',[
  ['Minimum for free delivery','orderTotal >= 500'],['Charge for this order','if / else chooses fee'],['Delivery option S','switch chooses Standard']
 ],[
  frame('Check the order value','The order is Rs 420. Compare it with the free-delivery threshold of Rs 500.','if (orderTotal >= 500)',[named('Decision',[['orderTotal',420],['threshold',500],['420 >= 500','false']],[2])]),
  frame('Take the else branch','The condition is false, so only the else branch runs and sets fee to 40.','else { fee = 40; }',[named('Chosen branch',[['fee',40]],[0])]),
  frame('Match the delivery code','The switch value is S, so the Standard case runs. break prevents falling into the next case.','case "S": delivery = "Standard"; break;',[named('Option',[['code','S'],['delivery','Standard']],[1])]),
  frame('Combine the results','The fee decision and the option label produce one readable confirmation.','System.out.println(delivery + " delivery: Rs " + fee);',[named('Output',[['confirmation','Standard delivery: Rs 40']],[0])])
 ]),
 'loops':lesson('planning','A five-day savings plan repeats the same action while one counter moves forward.',[
  ['Current day','int day'],['Daily deposit','total += 20'],['Last allowed day','day <= 5']
 ],[
  frame('Begin before day 1','Start the total at 0. The loop counter starts at 1.','int total = 0;\nfor (int day = 1; day <= 5; day++)',[named('Before the first deposit',[['day',1],['total',0]])]),
  ...[1,2,3,4,5].map(day=>frame('Day '+day+': add Rs 20',`The condition ${day} <= 5 is true. Add 20 to the previous total of ${(day-1)*20}.`,'total += 20;',[values('Deposits so far',Array.from({length:day},()=>20),[day-1],Array.from({length:day},(_,i)=>'day '+(i+1))),named('Saved so far',[['total',day*20]],[0])])),
  frame('Stop before day 6','After the fifth iteration, day becomes 6. The condition is false, so no sixth deposit happens.','day++; // day becomes 6\n// 6 <= 5 is false',[named('Loop ends',[['day',6],['total',100]],[0])])
 ]),
 'tracing':lesson('transport','Follow a prepaid wallet one transaction at a time. Each statement uses the latest balance.',[
  ['Money in the wallet','balance'],['Pay for a journey','balance -= 35'],['Add money','balance += 100']
 ],[
  frame('Read the starting state','The wallet begins with Rs 200. Write down this value before executing the next line.','int balance = 200;',[named('Wallet',[['balance',200]],[0])]),
  frame('Pay for the bus','Subtract Rs 35 from 200. The stored balance becomes 165.','balance -= 35;',[named('Transaction',[['before',200],['bus fare','−35'],['balance',165]],[2])]),
  frame('Top up','Add Rs 100 to the current balance, 165—not the original 200.','balance += 100;',[named('Transaction',[['before',165],['top-up','+100'],['balance',265]],[2])]),
  frame('Pay for lunch','Subtract Rs 60 from 265. The final balance is Rs 205.','balance -= 60;',[named('Transaction',[['before',265],['lunch','−60'],['balance',205]],[2])])
 ]),
 'number-problems':lesson('delivery','Treat an order number as a sequence of digits. Remainder and division let you remove one digit at a time.',[
  ['Rightmost digit','order % 10'],['Remaining digits','order / 10'],['Running digit sum','sum += digit']
 ],[
  frame('Start with the whole number','Use 4827 and a digit sum of 0. The loop runs while digits remain.','int order = 4827;\nint sum = 0;',[named('State',[['order',4827],['sum',0]])]),
  ...[[4827,7,482,7],[482,2,48,9],[48,8,4,17],[4,4,0,21]].map(([before,digit,after,sum])=>frame('Take the digit '+digit,`${before} % 10 gives ${digit}. Add it to sum, then integer division removes that last digit.`,'sum += order % 10;\norder /= 10;',[named('After this iteration',[['digit',digit],['remaining order',after],['sum',sum]],[0,2])])),
  frame('No digits remain','order is now 0, so the loop stops. 4 + 8 + 2 + 7 = 21.','System.out.println("Digit sum: " + sum);',[named('Result',[['digit sum',21]],[0])],'This digit sum is a learning example, not a secure verification method.')
 ]),
 'pattern-problems':lesson('cinema','Rows of cinema seats make nested loops visible: finish each row before starting the next one.',[
  ['Row being printed','outer row loop'],['Seat in that row','inner seat loop'],['Move to the next row','println() after inner loop']
 ],[
  frame('Print the first seat','The outer loop is on row 1. The inner loop prints the first [ ] without a newline.','System.out.print("[ ]");',[values('Row 1',['[ ]'],[0],['seat 1'])]),
  frame('Finish row 1','The inner loop prints four seats. println() then moves output to a new line.','for (int seat = 1; seat <= 4; seat++)\n    System.out.print("[ ]");\nSystem.out.println();',[values('Row 1',['[ ]','[ ]','[ ]','[ ]'],[1,2,3],['seat 1','seat 2','seat 3','seat 4'])]),
  frame('Repeat for row 2','The outer loop increments row. The inner seat counter starts at 1 again.','// row = 2; seat starts at 1 again',[values('Row 1',['[ ]','[ ]','[ ]','[ ]'],[],['seat 1','seat 2','seat 3','seat 4']),values('Row 2',['[ ]','[ ]','[ ]','[ ]'],[0,1,2,3],['seat 1','seat 2','seat 3','seat 4'])]),
  frame('Finish row 3 and stop','Three outer iterations, each with four inner iterations, print 12 seats in total.','// row = 4 makes row <= 3 false',[values('Row 1',['[ ]','[ ]','[ ]','[ ]'],[],['seat 1','seat 2','seat 3','seat 4']),values('Row 2',['[ ]','[ ]','[ ]','[ ]'],[],['seat 1','seat 2','seat 3','seat 4']),values('Row 3',['[ ]','[ ]','[ ]','[ ]'],[0,1,2,3],['seat 1','seat 2','seat 3','seat 4'])])
 ]),
 'methods':lesson('delivery','A delivery-fee method is one reusable rule. Different orders supply different arguments.',[
  ['Order value sent to the rule','argument'],['total inside the method','parameter'],['Calculated delivery fee','return value']
 ],[
  frame('Define the rule once','The parameter total receives an order amount. Return 0 for totals of at least 500; otherwise return 40.','static int deliveryFee(int total) {\n    return total >= 500 ? 0 : 40;\n}',[named('Reusable rule',[['input','total'],['output','fee']])]),
  frame('Call it with 420','420 becomes the parameter value for this call. The comparison is false, so the returned value is 40.','deliveryFee(420)',[named('First call',[['argument',420],['returned',40]],[1])]),
  frame('Call it with 800','A fresh call uses 800. The same method now returns 0.','deliveryFee(800)',[named('Second call',[['argument',800],['returned',0]],[1])])
 ]),
 'arrays':lesson('planning','Store a week of temperature readings in one ordered group. An index identifies each day.',[
  ['Seven daily temperatures','int[] temperatures'],['Position of a reading','index 0 through 6'],['Highest seen so far','hottest']
 ],[
  frame('Start with the first reading','Use the first value as the initial maximum. This also works when every temperature is negative.','int hottest = temperatures[0];',[values('Temperatures',[30,32,31,34,29,33,30],[0]),named('Maximum so far',[['hottest',30]])]),
  frame('A warmer reading appears','After checking 30, compare 32 with the current maximum 30. Replace hottest with 32.','if (temperature > hottest) hottest = temperature;',[values('Temperatures',[30,32,31,34,29,33,30],[1]),named('Maximum so far',[['hottest',32]],[0])]),
  frame('Keep 32, then find 34','31 does not beat 32. The next reading, 34, does, so update the maximum again.','// 31 > 32 is false; 34 > 32 is true',[values('Temperatures',[30,32,31,34,29,33,30],[3]),named('Maximum so far',[['hottest',34]],[0])]),
  frame('Check the remaining readings','29, 33, and 30 are all lower than 34. Every element has been checked; the answer is 34.','System.out.println("Hottest: " + hottest);',[values('Temperatures',[30,32,31,34,29,33,30],[4,5,6]),named('Result',[['hottest',34]])])
 ]),
 'strings':lesson('classroom','A form may receive extra spaces or different letter cases. String methods help compare the intended text.',[
  ['Original form entry','raw'],['Name without outer spaces','raw.trim()'],['Case-insensitive comparison','equalsIgnoreCase()']
 ],[
  frame('Keep the original input','The quotes make the two leading and two trailing spaces visible here.','String raw = "  Meena  ";',[named('Text',[['raw','"  Meena  "']],[0])]),
  frame('Create a trimmed string','trim() returns a String without outer whitespace. raw still contains the original text.','String name = raw.trim();',[named('Two values',[['raw','"  Meena  "'],['name','"Meena"']],[1])]),
  frame('Count the characters','The trimmed name contains five characters. This is a method call, so length has parentheses.','name.length()',[values('Characters',['M','e','e','n','a']),named('Length',[['length()',5]],[0])]),
  frame('Compare without letter case','Meena and MEENA have the same letters when case is ignored. Use a content-comparison method, not ==.','name.equalsIgnoreCase("MEENA")',[named('Comparison',[['result','true']],[0])])
 ]),
 'stringbuilder':lesson('cafe','A receipt grows as items are added. StringBuilder lets the same builder accumulate text.',[
  ['Receipt under construction','StringBuilder receipt'],['Add another piece','append()'],['Go to the next line','append("\\n")']
 ],[
  frame('Start an empty receipt','Create a mutable builder with no characters yet.','StringBuilder receipt = new StringBuilder();',[named('Builder content',[['receipt','(empty)']])]),
  frame('Append the first item','Each append adds to the end. The newline starts the next receipt line.','receipt.append("Tea: ").append(15).append("\\n");',[named('Builder content',[['receipt','Tea: 15\n']],[0])]),
  frame('Append the next item','The existing tea line stays in place while a sandwich line is added.','receipt.append("Sandwich: ").append(40).append("\\n");',[named('Builder content',[['receipt','Tea: 15\nSandwich: 40\n']],[0])]),
  frame('Append the total','The final append completes the receipt. Printing the builder shows all accumulated text.','receipt.append("Total: ").append(55);',[named('Builder content',[['receipt','Tea: 15\nSandwich: 40\nTotal: 55']],[0])])
 ]),
 'array-problems':lesson('classroom','Compare consecutive test scores to measure change, including when a score goes down.',[
  ['Ordered test results','int[] scores'],['Current test','scores[i]'],['Previous test','scores[i - 1]']
 ],[
  frame('Start at the second score','The first score has no previous value. Begin at index 1 so i - 1 is valid.','for (int i = 1; i < scores.length; i++)',[values('Scores',[50,65,60,80],[0,1])]),
  ...[[1,65,50,15],[2,60,65,-5],[3,80,60,20]].map(([i,current,previous,diff])=>frame('Compare test '+(i+1)+' with test '+i,`${current} − ${previous} = ${diff}. ${diff<0?'A negative change means the score decreased.':'A positive change means the score increased.'}`,'int change = scores[i] - scores[i - 1];',[values('Scores',[50,65,60,80],[i-1,i]),named('Difference',[['change',diff]],[0])]))
 ]),
 'string-problems':lesson('classroom','Scan a message character by character, and count only the positions that match the target.',[
  ['Message to inspect','String message'],['Letter to count',"'a'"],['Letter at a position','message.charAt(i)']
 ],[
  frame('Prepare the scan','The message is banana, the target is a, and count starts at 0. Indexing begins at 0.','String message = "banana";\nint count = 0;',[values('Message',['b','a','n','a','n','a']),named('Matches',[['count',0]])]),
  ...[1,3,5].map((index,i)=>frame('Match at index '+index,`The letter at index ${index} is a. ${i===0?'The earlier b did not match.':'The n between matches did not increase the count.'} Increase count to ${i+1}.`,'if (message.charAt(i) == \'a\') count++;',[values('Message',['b','a','n','a','n','a'],[index]),named('Matches so far',[['count',i+1]],[0])])),
  frame('Finish after the final character','All six positions have been inspected. Three of them contain a.','System.out.println("Letter a: " + count);',[values('Matching positions',['b','a','n','a','n','a'],[1,3,5]),named('Result',[['count',3]])])
 ]),
 'edge-cases':lesson('groceries','An empty basket is a valid situation. Check it before calculating an average.',[
  ['Items in the basket','prices array'],['No items available','prices.length == 0'],['Stop this method safely','return']
 ],[
  frame('Try an empty basket','There are no prices to add and the item count is 0. Dividing by the count would be inappropriate.','printAverage(new int[] {});',[values('Basket',[]),named('Item count',[['length',0]])]),
  frame('Use the early return','The guard prints No items and exits this call. The averaging code is not reached.','if (prices.length == 0) {\n    System.out.println("No items");\n    return;\n}',[named('Empty-basket result',[['output','No items']],[0])]),
  frame('Try a basket with two items','For [20, 40], the length is 2. The guard is false, so add the prices.','printAverage(new int[] {20, 40});',[values('Basket',[20,40],[0,1]),named('Sum',[['total',60]])]),
  frame('Calculate the nonempty average','Convert to double before dividing so the result can include a fractional part.','System.out.println("Average: " + (double) sum / prices.length);',[named('Calculation',[['sum',60],['length',2],['average','30.0']],[2])])
 ]),
 'mathematical-logic':lesson('transport','Two repeating bus schedules line up again at the least common multiple of their intervals.',[
  ['Bus intervals','6 and 8 minutes'],['Largest common divisor','gcd(6, 8)'],['First shared departure after 0','lcm = a / gcd * b']
 ],[
  frame('List a few departures','Both buses depart at minute 0. We want the first later minute they share.','int first = 6;\nint second = 8;',[values('Bus A: every 6 minutes',[6,12,18,24],[],['1st','2nd','3rd','4th']),values('Bus B: every 8 minutes',[8,16,24],[],['1st','2nd','3rd'])]),
  frame('Reduce the GCD inputs','Euclid repeatedly replaces (a, b) with (b, a % b): (6,8) → (8,6) → (6,2) → (2,0).','int remainder = a % b;\na = b;\nb = remainder;',[named('GCD states',[['start','6, 8'],['next','8, 6'],['next','6, 2'],['stop','2, 0']],[3])]),
  frame('Calculate the shared interval','The GCD is 2. Divide first, then multiply: 6 / 2 × 8 = 24.','int together = first / gcd(first, second) * second;',[named('Calculation',[['gcd',2],['lcm',24]],[1])]),
  frame('Check against the schedules','Minute 24 is both the fourth multiple of 6 and the third multiple of 8.','System.out.println("Together after " + together + " minutes");',[values('Bus A',[6,12,18,24],[3]),values('Bus B',[8,16,24],[2])])
 ]),
 'oop':lesson('library','Each library book is a separate object. A shared class describes what every book stores and can do.',[
  ['Book description/template','class Book'],['One particular book','new Book(...)'],['Borrow this book','object.borrow()']
 ],[
  frame('Describe a book','The class contains a title field, a borrowed flag, and a borrow method. It describes the shape of each object.','class Book {\n    String title;\n    boolean borrowed;\n    // constructor and borrow() below\n}',[named('Class template',[['title','String'],['borrowed','boolean'],['action','borrow()']])]),
  frame('Create two independent objects','Each new Book has its own fields. Both borrowed flags begin as false.','Book java = new Book("Java Basics");\nBook maths = new Book("Maths");',[named('java object',[['title','Java Basics'],['borrowed','false']]),named('maths object',[['title','Maths'],['borrowed','false']])]),
  frame('Change only the Java book','Calling java.borrow() sets borrowed on that object. The maths object stays unchanged.','java.borrow();',[named('java object',[['title','Java Basics'],['borrowed','true']],[1]),named('maths object',[['title','Maths'],['borrowed','false']])])
 ]),
 'recursion-basics':lesson('planning','A countdown solves a smaller version of the same task until a stopping value is reached.',[
  ['Current countdown number','n'],['Continue with one less','countdown(n - 1)'],['Stop at zero','base case']
 ],[
  ...[3,2,1].map(n=>frame('Call countdown('+n+')',`${n} is not zero. Print ${n}, then call the same method with ${n-1}. Each call waits for the smaller call to finish.`,'System.out.println(n);\ncountdown(n - 1);',[values('Calls waiting / running',Array.from({length:4-n},(_,i)=>'countdown('+(3-i)+')'),[3-n],Array.from({length:4-n},(_,i)=>'call '+(i+1)),true),named('Printed so far',[['output',Array.from({length:4-n},(_,i)=>String(3-i)).join('\n')]])])),
  frame('Reach the base case','At n = 0, print Go! and return without making another recursive call. The waiting calls can then return in reverse order.','if (n == 0) {\n    System.out.println("Go!");\n    return;\n}',[named('Complete output',[['output','3\n2\n1\nGo!']],[0])])
 ]),
 'complexity':lesson('delivery','Searching sorted parcel IDs shows how the number of checks grows with the amount of data.',[
  ['Number of parcel IDs','n'],['Check every ID in order','linear search: O(n)'],['Halve a sorted search range','binary search: O(log n)']
 ],[
  frame('Search for parcel 8','There are eight sorted IDs. Count value comparisons, not elapsed milliseconds.','int target = 8;',[values('Parcel IDs',[1,2,3,4,5,6,7,8])]),
  frame('Scan from the beginning','Linear search checks 1, 2, 3, 4, 5, 6, 7, then 8: eight checks in this example.','for (int id : ids) { /* check id */ }',[values('Linear: checked IDs',[1,2,3,4,5,6,7,8],[7]),named('Checks',[['linear',8]])]),
  frame('Halve the search range','Binary search checks midpoint values 4, 6, 7, then 8. The sorted order lets it discard part of the range each time.','int mid = low + (high - low) / 2;',[values('Binary: checked values',[4,6,7,8],[3],['check 1','check 2','check 3','check 4']),named('Checks',[['binary',4]])]),
  frame('Describe how the work grows','These observed counts are 8 and 4. The general worst-case growth is O(n) versus O(log n); both shown implementations use constant extra space.','// Linear: O(n) time\n// Binary: O(log n) time',[named('Growth as n increases',[['linear time','O(n)'],['binary time','O(log n)'],['extra space','O(1)']])],'Big-O describes growth, not an exact running time or an exact number of operations.')
 ]),
 'arraylist':lesson('groceries','A shopping list grows and shrinks. ArrayList stores items in order and shifts them when an item is removed.',[
  ['Ordered shopping list','ArrayList<String>'],['Add an item at the end','add()'],['Remove a named item','remove("Bread")']
 ],[
  frame('Create an empty list','Unlike a fixed-length array, this list can change its size.','ArrayList<String> shopping = new ArrayList<>();',[values('Shopping list',[])]),
  frame('Add three items','Each add appends to the end. The positions are now 0, 1, and 2.','shopping.add("Milk");\nshopping.add("Bread");\nshopping.add("Eggs");',[values('Shopping list',['Milk','Bread','Eggs'],[0,1,2])]),
  frame('Remove Bread','The String argument removes that item. Eggs shifts from index 2 to index 1.','shopping.remove("Bread");',[values('Shopping list',['Milk','Eggs'],[1])]),
  frame('Read the current size','size() reports how many items remain, not the internal storage capacity.','System.out.println("Items: " + shopping.size());',[values('Shopping list',['Milk','Eggs']),named('Count',[['size()',2]],[0])])
 ]),
 'linkedlist-api':lesson('music','A playlist can be edited at both ends. Java LinkedList provides convenient first and last operations.',[
  ['Playlist','LinkedList<String>'],['Intro before the first track','addFirst()'],['Remove the first track','removeFirst()']
 ],[
  frame('Add the main track','The playlist starts with Track A. It is currently both the first and last item.','playlist.add("Track A");',[values('Playlist',['Track A'],[0],['first / last'],true)]),
  frame('Put the intro first','addFirst makes Intro the new first element without changing Track A.','playlist.addFirst("Intro");',[values('Playlist',['Intro','Track A'],[0],['first','last'],true)]),
  frame('Add the outro last','addLast appends Outro at the end.','playlist.addLast("Outro");',[values('Playlist',['Intro','Track A','Outro'],[2],['first','next','last'],true)]),
  frame('Remove the intro','removeFirst returns Intro and removes it. Track A becomes the first item again.','playlist.removeFirst();',[values('Playlist',['Track A','Outro'],[0],['first','last'],true)],'The arrows show playlist order. Java LinkedList internally links nodes in both directions.')
 ]),
 'hashmap':lesson('cafe','A menu matches a product name to its price. One key has one current value in the map.',[
  ['Product name','key'],['Product price','value'],['Look up by product name','get() or getOrDefault()']
 ],[
  frame('Add menu entries','Store Tea → 15 and Coffee → 25. The names are keys and the prices are values.','prices.put("Tea", 15);\nprices.put("Coffee", 25);',[named('Price map',[['Tea',15],['Coffee',25]],[0,1])]),
  frame('Update an existing key','Putting Tea again replaces its previous price. It does not create a second Tea entry.','prices.put("Tea", 20);',[named('Price map',[['Tea',20],['Coffee',25]],[0])]),
  frame('Look up Tea','get("Tea") finds the value associated with that exact key: 20.','prices.get("Tea")',[named('Price map',[['Tea',20],['Coffee',25]],[0]),named('Lookup result',[['Tea',20]])]),
  frame('Handle a missing product','Juice is absent, so getOrDefault returns −1. Reading a missing key does not add it; size remains 2.','prices.getOrDefault("Juice", -1)',[named('Lookup result',[['Juice',-1],['map size',2]],[0])],'The displayed order is illustrative. HashMap does not promise iteration order.')
 ]),
 'hashset':lesson('meeting','Count each visitor once even if the same ID is scanned again.',[
  ['Visitor identifier','String'],['Unique IDs already seen','HashSet<String>'],['Check membership','contains()']
 ],[
  frame('Record the first visitor','Adding A12 creates one member in the set.','visitors.add("A12");',[values('Unique visitor IDs',['A12'],[0],['member'])]),
  frame('Record another visitor','B34 is different from A12, so it increases the number of unique IDs to 2.','visitors.add("B34");',[values('Unique visitor IDs',['A12','B34'],[1],['member','member'])]),
  frame('Ignore a duplicate','Adding A12 again does not create another member. The set still has two IDs.','visitors.add("A12");',[values('Unique visitor IDs',['A12','B34'],[0],['already present','member']),named('Size',[['size()',2]])]),
  frame('Ask whether B34 is present','contains checks membership and returns true.','visitors.contains("B34")',[named('Membership result',[['B34 present?','true']],[0])],'HashSet does not guarantee iteration order; these boxes show membership only.')
 ]),
 'deque-api':lesson('classroom','Undo works from the newest action backward. A Deque can act as a stack.',[
  ['New editing action','push()'],['Undo newest action','pop()'],['Inspect newest remaining action','peek()']
 ],[
  frame('Record Circle','push places the action at the front, which we use as the stack top.','history.push("Circle");',[values('Undo stack: top → bottom',['Circle'],[0],['top'])]),
  frame('Record Line','Line becomes the top item because it happened most recently.','history.push("Line");',[values('Undo stack: top → bottom',['Line','Circle'],[0],['top','older'])]),
  frame('Undo the newest action','pop removes and returns Line. Circle is now at the top.','history.pop();',[values('Remaining stack',['Circle'],[0],['top']),named('Removed',[['undo','Line']])]),
  frame('Inspect without removing','peek returns Circle while leaving it in the stack.','history.peek();',[values('Remaining stack',['Circle'],[0],['top']),named('Result',[['peek','Circle']])])
 ]),
 'queue-api':lesson('printing','A printer processes the first job received before the jobs that arrived later.',[
  ['Incoming print job','offer() at the back'],['Next job to print','poll() from the front'],['Look at the next job','peek()']
 ],[
  frame('Queue the report','The first job is both the front and the back of the queue.','printJobs.offer("Report");',[values('Queue: front → back',['Report'],[0],['front / back'],true)]),
  frame('Queue the invoice','Invoice joins the back. Report keeps its place at the front.','printJobs.offer("Invoice");',[values('Queue: front → back',['Report','Invoice'],[1],['front','back'],true)]),
  frame('Print the oldest job','poll removes Report from the front. Invoice is next.','printJobs.poll();',[values('Waiting queue',['Invoice'],[0],['front']),named('Removed job',[['printing','Report']])]),
  frame('Check what is next','peek returns Invoice without removing it.','printJobs.peek();',[values('Waiting queue',['Invoice'],[0],['front']),named('Result',[['peek','Invoice']])])
 ]),
 'priorityqueue':lesson('planning','A reminder queue should return the earliest time, even when reminders are inserted out of order.',[
  ['Reminder time','minutes after midnight'],['Store pending reminders','PriorityQueue<Integer>'],['Remove the earliest time','poll()']
 ],[
  frame('Insert three reminder times','Add 540, 480, and 510 minutes: 9:00, 8:00, and 8:30. The default PriorityQueue gives the smallest number priority.','reminders.offer(540);\nreminders.offer(480);\nreminders.offer(510);',[named('Pending reminders · insertion order shown',[['9:00',540],['8:00',480],['8:30',510]])]),
  frame('Poll the earliest','480 is the smallest value, so 8:00 leaves first even though it was inserted second.','reminders.poll();',[named('Still pending',[['9:00',540],['8:30',510]]),named('Returned',[['8:00',480]],[0])]),
  frame('Poll the next earliest','Among the remaining times, 510 is smallest. The second reminder is 8:30.','reminders.poll();',[named('Still pending',[['9:00',540]]),named('Returned',[['8:30',510]],[0])],'The boxes show pending items, not the internal heap layout. Iterating a PriorityQueue is not a sorted traversal.')
 ]),
 'comparator':lesson('classroom','Choose the sorting rule explicitly: shortest names first, then alphabetical order for equal lengths.',[
  ['Primary ordering rule','comparingInt(String::length)'],['Tie-breaking rule','thenComparing(naturalOrder())'],['Apply both rules','names.sort(comparator)']
 ],[
  frame('Inspect the original names','The names begin in this order. Each length is shown below its name.','List<String> names = new ArrayList<>(Arrays.asList("Sam", "Meena", "Jo", "Ali"));',[values('Original order',['Sam','Meena','Jo','Ali'],[],['3 letters','5 letters','2 letters','3 letters'])]),
  frame('Choose length as the main key','Jo has length 2, Sam and Ali tie at 3, and Meena has length 5. This is how to reason about the rule, not an intermediate sort trace.','Comparator.comparingInt(String::length)',[named('Length groups',[['2','Jo'],['3','Sam, Ali'],['5','Meena']],[1])]),
  frame('Break the three-letter tie','Alphabetically, Ali comes before Sam. thenComparing only decides when the lengths are equal.','.thenComparing(Comparator.naturalOrder())',[values('Tie-break result',['Ali','Sam'],[0,1],['first','second'])]),
  frame('Apply the combined ordering','The final order respects both rules: Jo, Ali, Sam, Meena.','names.sort(Comparator.comparingInt(String::length)\n    .thenComparing(Comparator.naturalOrder()));',[values('Sorted names',['Jo','Ali','Sam','Meena'],[0,1,2,3],['2 letters','3 letters','3 letters','5 letters'])])
 ]),
 'collections':lesson('classroom','Use standard collection helpers to answer common questions about a group of scores.',[
  ['Highest score','Collections.max()'],['How often 70 appears','Collections.frequency()'],['Put scores in ascending order','Collections.sort()']
 ],[
  frame('Start with a mutable score list','There are four scores, including two occurrences of 70.','List<Integer> scores = new ArrayList<>(Arrays.asList(70, 90, 70, 80));',[values('Scores',[70,90,70,80])]),
  frame('Find the maximum','max returns 90. It does not reorder or remove values.','Collections.max(scores)',[values('Scores',[70,90,70,80],[1]),named('Result',[['maximum',90]])]),
  frame('Count occurrences of 70','frequency compares values and finds two matches. The list still has its original order.','Collections.frequency(scores, 70)',[values('Scores',[70,90,70,80],[0,2]),named('Result',[['frequency',2]])]),
  frame('Sort the same list','sort changes the mutable list into ascending order.','Collections.sort(scores);',[values('Sorted scores',[70,70,80,90],[0,1,2,3])])
 ]),
 'searching':lesson('meeting','An unsorted guest list gives no clue where a name might be. Check one position at a time.',[
  ['Guest names','String[] guests'],['Name to find','target'],['Position if found','index, initially -1']
 ],[
  frame('Begin with no match','Set index to -1 so a failed search has an explicit result. The target is Asha.','int index = -1;',[values('Guests',['Ravi','Meena','Asha']),named('Result so far',[['index',-1]])]),
  ...[0,1].map(i=>frame('Check index '+i,`${i===0?'Ravi':'Meena'} does not equal Asha. Leave index as -1 and continue.`,'if (guests[i].equals(target))',[values('Guests',['Ravi','Meena','Asha'],[i]),named('Result so far',[['index',-1]])])),
  frame('Find Asha at index 2','Store the matching position and break so no later elements are checked.','index = i;\nbreak;',[values('Guests',['Ravi','Meena','Asha'],[2]),named('Result',[['index',2]],[0])])
 ]),
 'sorting':lesson('delivery','Arrange delivery distances from smallest to largest by repeatedly selecting the smallest remaining value.',[
  ['Delivery distances','int[] distances'],['Smallest in the unsorted part','minimum index'],['Place it at the next position','swap']
 ],[
  frame('Start unsorted','Selection sort separates a finished prefix from the part still being searched. Initially the prefix is empty.','int[] distances = {7, 2, 5, 1};',[values('Distances',[7,2,5,1])]),
  frame('Find the smallest value','Scan all four values. The smallest is 1 at index 3.','if (distances[j] < distances[smallest]) smallest = j;',[values('Distances',[7,2,5,1],[3]),named('Choice',[['smallest index',3]])]),
  frame('Place 1 at index 0','Swap the first unsorted value, 7, with the chosen minimum, 1.','int temp = distances[i];\ndistances[i] = distances[smallest];\ndistances[smallest] = temp;',[values('Distances',[1,2,5,7],[0,3])]),
  frame('Finish the remaining positions','For these values, 2 and then 5 are already the smallest in their remaining ranges. The final order stays [1, 2, 5, 7].','// Continue selection for i = 1 and i = 2',[values('Sorted distances',[1,2,5,7],[0,1,2,3])],'Sorting distances alone does not solve a delivery-route planning problem.')
 ]),
 'binary-search':lesson('cinema','Sorted booking IDs let you rule out half of the remaining possibilities after a comparison.',[
  ['Remaining possible positions','low … high'],['Middle position','low + (high - low) / 2'],['Direction to continue','compare bookings[mid] with target']
 ],[
  frame('Start with the whole sorted range','The target is 120. low = 0 and high = 4 include all five IDs.','int low = 0, high = bookings.length - 1;',[values('Booking IDs',[101,105,110,120,130]),named('Bounds',[['low',0],['high',4],['target',120]])]),
  frame('Compare the middle ID','mid = 2, and bookings[2] is 110. Since 110 < 120, indices 0 through 2 cannot hold the target.','int mid = low + (high - low) / 2;',[values('Booking IDs',[101,105,110,120,130],[2]),named('Comparison',[['mid',2],['bookings[mid]',110]])]),
  frame('Keep only the right range','Set low to mid + 1, which is 3. high stays 4. The next midpoint is index 3.','low = mid + 1;',[values('Booking IDs',[101,105,110,120,130],[3,4]),named('Bounds',[['low',3],['high',4]])]),
  frame('Find the target','bookings[3] equals 120, so the result is index 3. Only two midpoint values were checked.','if (bookings[mid] == target) { answer = mid; break; }',[values('Booking IDs',[101,105,110,120,130],[3]),named('Result',[['answer',3]],[0])])
 ]),
 'brute-force':lesson('groceries','Two purchase prices should use a Rs 100 gift card exactly. Remembering earlier prices avoids rechecking every pair.',[
  ['Try every distinct pair','two nested loops'],['Price still needed','target - price'],['Earlier prices for quick lookup','HashSet<Integer> seen']
 ],[
  frame('Understand the simple approach','A brute-force solution can test pairs such as 40 + 60, 40 + 25, and so on. Its worst-case work is O(n²). The Java example below uses the faster lookup approach.','// Brute force: try pairs with i < j',[values('Prices',[40,60,25,75]),named('Goal',[['target',100]])]),
  frame('Read 40 and look for 60','The set starts empty. 100 − 40 = 60 has not appeared, so remember 40 for later.','int needed = target - price;\nseen.add(price);',[named('Current check',[['price',40],['needed',60]]),values('Seen prices',[40],[0],['member'])]),
  frame('Read 60 and look for 40','Now 100 − 60 = 40 is already in the set. These are two different purchases, because lookup happens before insertion.','if (seen.contains(needed))',[named('Current check',[['price',60],['needed',40]],[1]),values('Seen prices',[40],[0],['found'])]),
  frame('Return the pair','The example stops at the first match, 40 + 60 = 100. Other valid pairs can exist. Expected time is O(n), with O(n) extra memory.','System.out.println(needed + " + " + price + " = " + target);',[named('Match',[['pair','40 + 60'],['total',100]],[0,1])])
 ]),
 'two-pointers':lesson('cafe','Two ends of a sorted price list can move toward each other to find an exact budget.',[
  ['Cheapest remaining snack','prices[left]'],['Most expensive remaining snack','prices[right]'],['Pair cost','prices[left] + prices[right]']
 ],[
  frame('Place a pointer at each end','The prices are sorted. Start left at index 0 and right at index 4; target is 60.','int left = 0, right = prices.length - 1;',[values('Snack prices',[10,20,30,40,50],[0,4],['left','1','2','3','right'])]),
  frame('Add the endpoint prices','10 + 50 = 60. This exact example finds a match immediately, so neither pointer has moved.','int sum = prices[left] + prices[right];',[named('Comparison',[['left price',10],['right price',50],['sum',60]],[2])]),
  frame('Stop at the exact budget','The sum equals the target, so return this pair. In other inputs, a smaller sum moves left forward; a larger sum moves right backward.','if (sum == target) { /* print pair, then stop */ }',[values('Matching snacks',[10,50],[0,1],['index 0','index 4'])],'The sorted order is what makes those pointer moves safe.')
 ]),
 'sliding-window':lesson('cafe','To find a busy three-hour period, move one fixed-size window across hourly order counts.',[
  ['Three consecutive hours','window size k = 3'],['Hour leaving the window','orders[i - k]'],['Hour entering the window','orders[i]']
 ],[
  frame('Add the first three hours','The first window is 2 + 5 + 1 = 8. Store it as both the current sum and the best seen.','int window = 0;\nfor (int i = 0; i < k; i++) window += orders[i];',[values('Hourly orders',[2,5,1,3,6],[0,1,2]),named('Window',[['window',8],['best',8]])]),
  frame('Slide one position','Remove the outgoing 2 and add the incoming 3: 8 − 2 + 3 = 9. The middle two values stay in the window.','window += orders[i] - orders[i - k];',[values('Hourly orders',[2,5,1,3,6],[1,2,3]),named('Window',[['window',9],['best',9]],[0,1])]),
  frame('Slide once more','Remove 5 and add 6: 9 − 5 + 6 = 10. This is the best three-hour total.','best = Math.max(best, window);',[values('Hourly orders',[2,5,1,3,6],[2,3,4]),named('Window',[['window',10],['best',10]],[0,1])])
 ]),
 'prefix-sum':lesson('groceries','A running spending total lets you answer a date-range question with one subtraction.',[
  ['Daily spending','spending[i]'],['Total before position i','prefix[i]'],['Sum from left through right','prefix[right + 1] - prefix[left]']
 ],[
  frame('Start with a zero boundary','There are four spending values. The prefix array needs five positions so prefix[0] can mean no days included.','int[] prefix = new int[spending.length + 1];',[values('Daily spending',[20,30,10,40]),values('Prefix totals',[0,0,0,0,0],[0])]),
  frame('Build cumulative totals','Each position adds one more day: 0, 20, 50, 60, 100. prefix[4] is the sum of all four days.','prefix[i + 1] = prefix[i] + spending[i];',[values('Prefix totals',[0,20,50,60,100],[1,2,3,4])]),
  frame('Choose indices 1 through 3','The requested range is 30 + 10 + 40. We need the total through index 3, minus everything before index 1.','int left = 1, right = 3;',[values('Daily spending',[20,30,10,40],[1,2,3])]),
  frame('Subtract the earlier prefix','prefix[4] − prefix[1] = 100 − 20 = 80. The right + 1 boundary includes the last requested day.','int total = prefix[right + 1] - prefix[left];',[values('Prefix totals',[0,20,50,60,100],[1,4]),named('Range sum',[['total',80]],[0])])
 ]),
 'hashing':lesson('meeting','A vote counter remembers a running total for each candidate name.',[
  ['Candidate name','HashMap key'],['Votes received so far','HashMap value'],['First vote for an unseen name','getOrDefault(name, 0)']
 ],[
  frame('Read the first vote','Asha is not yet a key, so getOrDefault gives 0. Add 1 and store the new count.','counts.put(vote, counts.getOrDefault(vote, 0) + 1);',[named('Vote counts',[['Asha',1]],[0])]),
  frame('Read Ravi’s first vote','Ravi gets an independent entry with count 1. Asha’s count stays 1.','// vote = "Ravi"',[named('Vote counts',[['Asha',1],['Ravi',1]],[1])]),
  frame('Read two more Asha votes','Each vote reads and increments the existing Asha count: 1 → 2 → 3.','// next votes = "Asha", "Asha"',[named('Vote counts',[['Asha',3],['Ravi',1]],[0])]),
  frame('Read the final Ravi vote','Ravi goes from 1 to 2. Five votes have produced totals of 3 and 2.','// final vote = "Ravi"',[named('Final counts',[['Asha',3],['Ravi',2]],[1])],'Expected HashMap lookups are fast; hashing does not mean the keys are kept in sorted order.')
 ]),
 'problem-patterns':lesson('cafe','“Best total over consecutive days of a fixed length” is a clue for a fixed sliding window.',[
  ['Consecutive days','contiguous range'],['Exactly two days','fixed window k = 2'],['Largest running total','best = max(best, sum)']
 ],[
  frame('Spot the useful clues','The values are daily sales. We want two adjacent days, not any two days chosen from the list.','int[] sales = {4, 2, 7, 1};\nint k = 2;',[values('Daily sales',[4,2,7,1])]),
  frame('Start with the first window','The first two days total 4 + 2 = 6.','int sum = sales[0] + sales[1];',[values('Daily sales',[4,2,7,1],[0,1]),named('Window',[['sum',6],['best',6]])]),
  frame('Reuse the overlapping part','Subtract 4 and add 7: the next window total is 9. We did not sum the whole window again.','sum += sales[i] - sales[i - k];',[values('Daily sales',[4,2,7,1],[1,2]),named('Window',[['sum',9],['best',9]],[1])]),
  frame('Check the final window','Subtract 2 and add 1 to get 8. The best total remains 9 from the middle pair.','best = Math.max(best, sum);',[values('Daily sales',[4,2,7,1],[2,3]),named('Window',[['sum',8],['best',9]])])
 ]),
 'linked-list':lesson('transport','Train coaches form a useful analogy for nodes: each node holds data and a reference to the next node.',[
  ['Coach label','node.coach'],['Connection to the next coach','node.next'],['No coach after this one','null']
 ],[
  frame('Link the nodes','Create Engine, A1, and A2. head points to Engine, and the final next reference is null.','head.next = new Node("A1");\nhead.next.next = new Node("A2");',[values('Node chain',['Engine','A1','A2','null'],[0],['head','next','next','end'],true)]),
  frame('Visit the head','Read Engine from node, then follow node.next. Do not change head while traversing.','// Start traversal at head\nSystem.out.println(node.coach);',[values('Node chain',['Engine','A1','A2','null'],[0],['node','next','next','end'],true)]),
  frame('Follow the next reference','node moves to A1. Print A1, then move forward again.','node = node.next;',[values('Node chain',['Engine','A1','A2','null'],[1],['head','node','next','end'],true)]),
  frame('Visit A2, then stop at null','Print A2. Its next is null, so the loop condition fails on the next check.','for (Node node = head; node != null; node = node.next)',[values('Node chain',['Engine','A1','A2','null'],[2,3],['head','earlier node','last printed','node · stop'],true)],'The photo illustrates the chain idea; these Java nodes are a simplified data model.')
 ]),
 'stack-structure':lesson('classroom','Nested brackets must close in the reverse order in which they opened. That is a stack’s job.',[
  ['Opening bracket','push onto stack'],['Matching closing bracket','pop the latest opener'],['Nothing left unclosed','stack.isEmpty()']
 ],[
  frame('Read the opening parenthesis','Push (. It must wait until a matching ) is read.','stack.push(ch); // ch = \'(\'',[values('Input',['(','[',']',')'],[0]),values('Stack: top → bottom',['('],[0],['top'])]),
  frame('Read the opening square bracket','Push [ on top. It must close before the earlier (.','stack.push(ch); // ch = \'[\'',[values('Input',['(','[',']',')'],[1]),values('Stack: top → bottom',['[','('],[0],['top','older'])]),
  frame('Read the closing square bracket','The top is [, which matches ]. Pop it; ( remains.','char open = stack.pop(); // open = \'[\'',[values('Input',['(','[',']',')'],[2]),values('Remaining stack',['('],[0],['top'])]),
  frame('Close the parenthesis','The top ( matches ). After popping it, the stack is empty and the input is valid.','System.out.println("Balanced: " + (valid && stack.isEmpty()));',[values('Input',['(','[',']',')'],[3]),values('Remaining stack',[]),named('Result',[['valid','true']],[0])])
 ]),
 'queue-structure':lesson('support','A service counter can reuse a small array by wrapping its front position around the end.',[
  ['Oldest waiting ticket','items[front]'],['Next free position','(front + size) % capacity'],['Number of waiting tickets','size']
 ],[
  frame('Add ticket 101','Capacity is 3. front = 0 and size = 0, so insert at (0 + 0) % 3 = 0, then increase size.','items[(front + size) % items.length] = id;\nsize++;',[values('Physical array slots',[101,'unused','unused'],[0]),named('Queue state',[['front',0],['size',1]])]),
  frame('Add ticket 102','The next insertion index is (0 + 1) % 3 = 1.','queue.add(102);',[values('Physical array slots',[101,102,'unused'],[1]),named('Queue state',[['front',0],['size',2]])]),
  frame('Serve ticket 101','Read items[front], move front to 1, and decrease size. Slot 0 still contains 101 physically, but is no longer in the queue.','front = (front + 1) % items.length;\nsize--;',[values('Physical array slots',['101 (stale)',102,'unused'],[1]),named('Queue state',[['front',1],['size',1]])]),
  frame('Add ticket 103','Insert at (1 + 1) % 3 = 2. The logical queue order is 102, then 103.','queue.add(103);',[values('Physical array slots',['101 (stale)',102,103],[2]),named('Queue state',[['front',1],['size',2]])]),
  frame('Serve 102, then 103','After two removals, front moves 1 → 2 → 0 and size becomes 0. The array slots can be reused; stale values are not active queue members.','queue.remove();\nqueue.remove();',[values('Physical array slots',['101 (stale)','102 (stale)','103 (stale)']),named('Queue state',[['front',0],['size',0]],[0,1])])
 ]),
 'binary-tree':lesson('meeting','A small organisation chart makes parent and child relationships visible. This example limits each node to two children.',[
  ['Top person','root'],['Two reporting branches','left and right children'],['Visit one level at a time','breadth-first traversal with a queue']
 ],[
  {...frame('Begin at the root','Lead is the root, with Engineering on the left and Design on the right. Put Lead in the queue.','queue.offer(root);',[values('Queue',['Lead'],[0],['front'])]),network:tree(['Lead','Engineering','Design'],['root'])},
  {...frame('Visit Lead and queue the children','Remove Lead, print it, then add its left and right children in that order.','Node node = queue.poll();\nqueue.offer(node.left);\nqueue.offer(node.right);',[values('Queue',['Engineering','Design'],[0,1],['front','back']),named('Printed',[['output','Lead']])]),network:tree(['Lead','Engineering','Design'],['root'])},
  {...frame('Visit Engineering, then Design','Both children have no further children. The queue becomes empty and the traversal ends.','while (!queue.isEmpty())',[values('Queue',[]),named('Printed',[['output','Lead\nEngineering\nDesign']],[0])]),network:tree(['Lead','Engineering','Design'],['left','right'])}
 ]),
 'bst':lesson('delivery','A binary search tree uses comparisons to choose a branch when looking up a product ID.',[
  ['Current product ID','node.id'],['Smaller IDs','left subtree'],['Larger IDs','right subtree']
 ],[
  {...frame('Start at the root','The target is 70. Compare with root value 50 before following any child.','Node current = root;',[named('Search',[['target',70],['current',50]])]),network:tree(['50','30','70'],['root'])},
  {...frame('Choose the right branch','70 is greater than 50. The BST rule lets us skip the left subtree containing 30.','current = target < current.id ? current.left : current.right;',[named('Decision',[['70 > 50','go right']],[0])]),network:tree(['50','30','70'],['right'])},
  {...frame('Find a matching value','The current node is 70, so the search succeeds. A missing child would end an unsuccessful search.','System.out.println("Found: " + (current != null));',[named('Result',[['found','true']],[0])]),network:tree(['50','30','70'],['right'])}
 ]),
 'heap':lesson('support','A max-heap keeps the highest urgency score at the root, ready to serve next.',[
  ['Urgency score','node value'],['Most urgent ticket','root at index 0'],['Children of index i','2*i + 1 and 2*i + 2']
 ],[
  {...frame('Inspect the root and its children','The array is [20, 50, 30]. It is not a max-heap because child 50 is larger than parent 20.','int[] heap = {20, 50, 30};',[values('Array representation',[20,50,30])]),network:tree(['20','50','30'],['root'])},
  {...frame('Choose the largest of the three','Compare 20, 50, and 30. The largest is the left child at index 1.','int child = 2 * parent + 1;\nif (child + 1 < heap.length && heap[child + 1] > heap[child]) child++;',[named('Choice',[['child index',1],['value',50]],[0,1])]),network:tree(['20','50','30'],['left'])},
  {...frame('Swap the root with that child','The array becomes [50, 20, 30]. Heapify continues at the child position, but there are no children there in this example.','int temp = heap[parent];\nheap[parent] = heap[child];\nheap[child] = temp;\nparent = child;',[values('Array representation',[50,20,30],[0,1])]),network:tree(['50','20','30'],['root'])},
  {...frame('Read the highest priority','The root holds 50. The sibling values 20 and 30 need not be sorted relative to each other.','System.out.println("Highest priority: " + heap[0]);',[named('Next urgency',[['root',50]],[0])],'A heap is a partial ordering, not a fully sorted array.'),network:tree(['50','20','30'],['root'])}
 ]),
 'recursion':lesson('library','Nested folders repeat the same structure: count local files, then count each subfolder.',[
  ['Files directly in one folder','folder.ownFiles'],['Nested folders','folder.children'],['Count a smaller folder tree','totalFiles(child)']
 ],[
  {...frame('Start with local files','The root has 2 files of its own. Its two child folders have 1 and 3 files. These child folders have no further children.','int total = folder.ownFiles;',[named('Root subtotal',[['total',2]])]),network:tree(['Root: 2 files','Child: 1 file','Child: 3 files'],['root'])},
  {...frame('Count the first child','The first child returns 1. Add it to the root subtotal: 2 + 1 = 3.','total += totalFiles(child);',[named('Root subtotal',[['before',2],['returned',1],['total',3]],[2])]),network:tree(['Root: 2 files','Child: 1 file','Child: 3 files'],['left'])},
  {...frame('Count the next child','The second child returns 3. Add it to the running subtotal: 3 + 3 = 6.','total += totalFiles(child);',[named('Root subtotal',[['before',3],['returned',3],['total',6]],[2])]),network:tree(['Root: 2 files','Child: 1 file','Child: 3 files'],['right'])},
  frame('Return the complete count','The root returns 6. A leaf folder naturally stops recursion because its child list is empty.','return total;',[named('Result',[['total files',6]],[0])])
 ]),
 'backtracking':lesson('meeting','Choosing a team means making a choice, exploring it, and undoing it before trying the next option.',[
  ['Current partial team','chosen list'],['Next eligible person','start index'],['Undo the latest choice','remove last chosen person']
 ],[
  frame('Choose Asha first','Start an empty team, then add Asha. Future choices begin after Asha so people are not reused.','chosen.add(names[i]);\nteams(i + 1, chosen);',[values('Current team',['Asha'],[0],['chosen'])]),
  frame('Add Bala and record a team','The team has two people, so print it and return from this branch.','if (chosen.size() == 2) { /* print and return */ }',[values('Current team',['Asha','Bala'],[1],['chosen','chosen']),named('Recorded',[['team 1','Asha, Bala']])]),
  frame('Undo Bala and try Charu','Remove the last choice. Keep Asha, add Charu, and record the second team.','chosen.remove(chosen.size() - 1);',[values('Current team',['Asha','Charu'],[1],['kept','new choice']),named('Recorded',[['team 2','Asha, Charu']])]),
  frame('Back up and start with Bala','After undoing Charu and Asha, the next first choice is Bala. Adding Charu creates the final team.','// Continue the loop with the next first choice',[values('Current team',['Bala','Charu'],[0,1],['chosen','chosen']),named('Recorded',[['team 3','Bala, Charu']])]),
  frame('Finish all branches','Increasing the start index avoids duplicate orders such as Bala, Asha. There are three distinct two-person teams.','teams(0, new ArrayList<>());',[named('All teams',[['1','Asha, Bala'],['2','Asha, Charu'],['3','Bala, Charu']])])
 ]),
 'greedy':lesson('planning','When every meeting has equal value, choosing the earliest finish leaves room for more meetings afterward.',[
  ['Meeting start and end','[start, end) interval'],['Greedy ordering','sort by end time'],['Room becomes available','end']
 ],[
  frame('Order meetings by finish time','The meetings already appear in increasing end time. A meeting may start exactly when the previous one ends.','Arrays.sort(meetings, Comparator.comparingInt(m -> m[1]));',[values('Meetings',['[1, 3)','[2, 4)','[3, 5)','[5, 7)'],[],['A','B','C','D'])]),
  frame('Take meeting A','The first meeting finishes at 3. Set end to 3 and count to 1.','if (meeting[0] >= end) { count++; end = meeting[1]; }',[values('Meetings',['[1, 3)','[2, 4)','[3, 5)','[5, 7)'],[0],['take A','B','C','D']),named('Schedule',[['end',3],['count',1]])]),
  frame('Skip B; take C','B starts at 2, before the room is free at 3. C starts at 3, so it fits and moves end to 5.','// 2 >= 3 is false; 3 >= 3 is true',[values('Meetings',['[1, 3)','[2, 4)','[3, 5)','[5, 7)'],[2],['taken','skip','take C','D']),named('Schedule',[['end',5],['count',2]])]),
  frame('Take D and finish','D starts at 5, exactly when C ends. Three meetings fit: A, C, and D.','System.out.println("Meetings: " + count);',[values('Chosen meetings',['[1, 3)','[3, 5)','[5, 7)'],[2],['A','C','D']),named('Result',[['count',3]])],'This rule solves the maximum-count, unweighted meeting problem. Different rewards require a different analysis.')
 ]),
 'graphs':lesson('transport','Model bus stops as nodes and direct bus links as edges. BFS finds the fewest links when each link has the same cost.',[
  ['Bus stop','graph vertex'],['Direct link to another stop','directed edge'],['Fewest links from A','BFS distance']
 ],[
  frame('Start at stop A','Use indices 0, 1, 2, 3 for A, B, C, D. Record distance[0] = 0 and put A in a queue. The arrows represent available directed links.','distance[0] = 0;\nqueue.offer(0);',[values('Queue',['A'],[0],['front']),named('Known distances',[['A',0]])]),
  frame('Discover B and C','Remove A. Both neighbors are one link away, so record distance 1 and queue each once.','distance[next] = distance[stop] + 1;\nqueue.offer(next);',[values('Queue',['B','C'],[0,1],['front','back']),named('Known distances',[['A',0],['B',1],['C',1]],[1,2])]),
  frame('Discover D from B','Remove B. Its neighbor D is new, so distance[3] = 1 + 1 = 2. Put D after C in the queue.','if (distance[next] == -1)',[values('Queue',['C','D'],[1],['front','back']),named('Known distances',[['A',0],['B',1],['C',1],['D',2]],[3])]),
  frame('Avoid visiting D twice','When C is removed, its neighbor D is already discovered, so it is not queued again. D has no outgoing links.','System.out.println("Links from A to D: " + distance[3]);',[values('Queue',[]),named('Result',[['fewest links A → D',2]],[0])],'BFS gives shortest paths by edge count. Unequal travel times need a weighted shortest-path algorithm.')
 ].map((f,i)=>({...f,network:{nodes:[{id:'A',label:'A',x:70,y:105},{id:'B',label:'B',x:300,y:35},{id:'C',label:'C',x:300,y:175},{id:'D',label:'D',x:530,y:105}].map(n=>({...n,active:(i===0?['A']:i===1?['B','C']:['D']).includes(n.id)})),edges:[['A','B'],['A','C'],['B','D'],['C','D']] as [string,string][]}}))),
 'dynamic-programming':lesson('groceries','To pay exactly with the fewest vouchers, reuse the best answer already found for each smaller amount.',[
  ['Voucher values','1, 3, and 4'],['Best answer for amount a','dp[a]'],['Try one final voucher v','dp[a - v] + 1']
 ],[
  frame('Define the base case','Paying 0 needs 0 vouchers. Other amounts begin at 7, a sentinel larger than any possible answer for target 6 with a value-1 voucher.','dp[0] = 0; // other entries start at target + 1',[values('Minimum vouchers for amount',[0,7,7,7,7,7,7],[0])]),
  frame('Solve amounts 1 and 2','Only voucher 1 fits these amounts. dp[1] = dp[0] + 1 = 1; dp[2] = dp[1] + 1 = 2.','dp[value] = Math.min(dp[value], dp[value - voucher] + 1);',[values('Minimum vouchers for amount',[0,1,2,7,7,7,7],[1,2])]),
  frame('Use exact vouchers for 3 and 4','A single 3 voucher pays amount 3. A single 4 voucher pays amount 4. Both answers improve on using only ones.','// dp[3] = dp[0] + 1; dp[4] = dp[0] + 1',[values('Minimum vouchers for amount',[0,1,2,1,1,7,7],[3,4])]),
  frame('Build the answer for 5','Trying last vouchers 1, 3, and 4 gives 2, 3, and 2 vouchers in total. Keep the minimum, 2.','// min(dp[4] + 1, dp[2] + 1, dp[1] + 1)',[values('Minimum vouchers for amount',[0,1,2,1,1,2,7],[5])]),
  frame('Choose the best last voucher for 6','Last voucher 1 gives 3; last voucher 3 gives 2; last voucher 4 gives 3. Pick 2, corresponding to 3 + 3.','// min(dp[5] + 1, dp[3] + 1, dp[2] + 1)',[values('Minimum vouchers for amount',[0,1,2,1,1,2,2],[3,6]),named('Result',[['best payment','3 + 3'],['vouchers',2]],[1])],'Greedily choosing 4 first gives 4 + 1 + 1, which uses three vouchers. DP compares the alternatives.')
 ])
};
