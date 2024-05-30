// SplashKit functions patched using ld wrap
// Hopefully the mangled names don't change - if they do,
// this will need to be updated.

extern "C"
{
    // patch process_events()
    void __sko_process_events();
    void __real__ZN13splashkit_lib14process_eventsEv();

    void __wrap__ZN13splashkit_lib14process_eventsEv()
    {
        __sko_process_events(); // receive events from outside world and pass into SDL
        __real__ZN13splashkit_lib14process_eventsEv();
    }
}