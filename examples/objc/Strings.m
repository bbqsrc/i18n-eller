@import Foundation;
#import "Strings.h"

static NSString* _selectedLocale = nil;
static NSBundle* _selectedBundle = nil;

@implementation Strings

+(void)setLocale:(NSString*)locale
{
    _selectedLocale = locale;
    
    NSString* path = [[NSBundle mainBundle] pathForResource:locale ofType:@"lproj"];
    NSBundle* bundle = [[NSBundle alloc] initWithPath:path];
    
    if (bundle != nil) {
        [Strings setBundle:bundle];
    } else {
        [Strings setBundle:[NSBundle mainBundle]];
    }
}

+(NSString*)locale
{
    return _selectedLocale;
}

+(void)setBundle:(NSBundle *)bundle
{
    _selectedBundle = bundle;
}

+(NSBundle*)bundle
{
    if (_selectedBundle == nil) {
        return [NSBundle mainBundle];
    }
    
    return _selectedBundle;
}

+(NSString* _Nonnull)stringForKey:(NSString* _Nonnull)key
{
    return [[Strings bundle] localizedStringForKey:key value:nil table:nil];
}

+(NSArray<NSString* >* _Nonnull)stringArrayForKey:(NSString*)key withLength:(NSInteger)length
{
    NSMutableArray<NSString*>* arr = [[NSMutableArray alloc] initWithCapacity:length];
    NSBundle* bundle = [Strings bundle];
    
    for (int i = 0; i < length; ++i) {
        NSString* ikey = [NSString stringWithFormat:@"%@_%d", key, i];
        
        [arr addObject:[bundle localizedStringForKey:ikey value:nil table:nil]];
    }
    
    return arr;
}
/** This is a string. */
+(NSString* _Nonnull)firstItem
{
    return [Strings stringForKey:@"firstItem"];
}

/** I have {number} cats. */
+(NSString* _Nonnull)anotherItemWithNumber:(NSString* _Nonnull)number
{
    NSString* format = [Strings stringForKey:@"anotherItem"];
    return [NSString stringWithFormat:format, number];
}

@end