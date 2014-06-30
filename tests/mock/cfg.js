var a,
    b,
    f = function() {
    
};

function fn() {
    console.log('fn is called');
}

if(a) {
    console.log('a is true');
} else {
}

for(var i=0; i<10; i++) {
    if(a) {
        fn();
    }
    
    if(i==5)
        break;
}





