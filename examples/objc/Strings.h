@import Foundation;

@interface Strings : NSObject

@property (class, atomic, assign) NSString* _Nullable locale;
@property (class, atomic, assign) NSBundle* _Nonnull bundle;
+(NSString* _Nonnull)firstItem;
+(NSString* _Nonnull)anotherItemWithNumber:(NSString* _Nonnull)number;

@end